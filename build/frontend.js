/**
 * Giant Tile Slider — Frontend script.
 * No dependencies — pure vanilla JS.
 */
( function () {
	'use strict';

	function initSlider( root ) {
		var track        = root.querySelector( '.gts-track' );
		var viewport     = root.querySelector( '.gts-viewport' );
		var prevBtn      = root.querySelector( '.gts-prev' );
		var nextBtn      = root.querySelector( '.gts-next' );
		var progressBar  = root.querySelector( '.gts-progress-bar' );
		var progressTrack = root.querySelector( '.gts-progress-track' );
		var tiles        = root.querySelectorAll( '.gts-tile' );
		var arrowColor   = root.dataset.arrowColor || '#ffffff';

		if ( ! track || ! tiles.length ) return;

		var speed      = parseInt( root.dataset.speed, 10 )       || 500;
		var animation  = root.dataset.animation                    || 'slide';
		var tpv        = parseInt( root.dataset.tilesPerView, 10 ) || 4;

		/* Responsive tiles-per-view */
		function getTpv() {
			var w = window.innerWidth;
			if ( w < 450 )  return 1;
			if ( w < 900 )  return 2;
			if ( w < 1100 ) return Math.min( tpv, 3 );
			return tpv;
		}

		var total   = tiles.length;
		var current = 0; // index of leftmost visible tile

		/* ── Layout ─────────────────────────────────────────── */
		function layout() {
			var visible = getTpv();
			var gap     = 20;
			var vw      = viewport.offsetWidth;
			var tw      = ( vw - gap * ( visible - 1 ) ) / visible;

			[].forEach.call( tiles, function ( tile ) {
				tile.style.width    = tw + 'px';
				tile.style.flexShrink = '0';
			} );

			track.style.gap = gap + 'px';

			if ( animation === 'fade' ) {
				track.style.position = 'relative';
				[].forEach.call( tiles, function( tile, i ) {
					tile.style.position   = 'absolute';
					tile.style.top        = '0';
					tile.style.left       = '0';
					tile.style.opacity    = i === current ? '1' : '0';
					tile.style.transition = 'opacity ' + speed + 'ms ease';
					tile.style.width      = '100%';
					tile.style.zIndex     = i === current ? '1' : '0';
				} );
				track.style.height = tiles[ 0 ].offsetHeight + 'px';
			} else {
				[].forEach.call( tiles, function( tile ) {
					tile.style.position   = '';
					tile.style.top        = '';
					tile.style.left       = '';
					tile.style.opacity    = '';
					tile.style.zIndex     = '';
					tile.style.transition = '';
				} );
				slideTo( current, false );
			}

			updateProgress();
			updateArrows();
		}

		/* ── Slide ───────────────────────────────────────────── */
		function slideTo( idx, animate ) {
			var visible = getTpv();
			var max     = Math.max( 0, total - visible );
			idx = Math.max( 0, Math.min( idx, max ) );
			current = idx;

			if ( animation === 'fade' ) {
				[].forEach.call( tiles, function( tile, i ) {
					tile.style.opacity = ( i >= idx && i < idx + visible ) ? '1' : '0';
					tile.style.zIndex  = ( i >= idx && i < idx + visible ) ? '1' : '0';
				} );
				track.style.height = tiles[ idx ].offsetHeight + 'px';
			} else {
				var gap   = 20;
				var vw    = viewport.offsetWidth;
				var tw    = ( vw - gap * ( visible - 1 ) ) / visible;
				var shift = idx * ( tw + gap );

				track.style.transition = animate === false ? 'none' : 'transform ' + speed + 'ms ease';
				track.style.transform  = 'translateX(-' + shift + 'px)';
			}

			updateProgress();
			updateArrows();
		}

		function updateProgress() {
			if ( ! progressBar || ! progressTrack ) return;
			var visible   = getTpv();
			var max       = Math.max( 1, total - visible );
			var trackW    = progressTrack.offsetWidth;
			var thumbW    = progressBar.offsetWidth;
			var travel    = trackW - thumbW;
			var pct       = total <= visible ? 0 : ( current / max );
			progressBar.style.transform = 'translateX(' + ( travel * pct ) + 'px)';
		}

		/* ── Progress thumb drag ─────────────────────────────── */
		var thumbDragging  = false;
		var thumbStartX    = 0;
		var thumbStartSlide = 0;

		function thumbPosToSlide( clientX, startClientX, startSlide ) {
			var visible = getTpv();
			var max     = Math.max( 1, total - visible );
			var trackW  = progressTrack.offsetWidth;
			var thumbW  = progressBar.offsetWidth;
			var travel  = trackW - thumbW;
			if ( travel <= 0 ) return 0;
			var delta   = clientX - startClientX;
			var pct     = ( startSlide / max ) + ( delta / travel );
			return Math.round( Math.max( 0, Math.min( 1, pct ) ) * max );
		}

		if ( progressBar ) {
			progressBar.style.cursor = 'grab';

			progressBar.addEventListener( 'mousedown', function( e ) {
				e.preventDefault();
				thumbDragging  = true;
				thumbStartX    = e.clientX;
				thumbStartSlide = current;
				progressBar.style.cursor = 'grabbing';
				progressBar.style.transition = 'none';
			} );

			progressBar.addEventListener( 'touchstart', function( e ) {
				thumbDragging  = true;
				thumbStartX    = e.touches[ 0 ].clientX;
				thumbStartSlide = current;
				progressBar.style.transition = 'none';
			}, { passive: true } );
		}

		window.addEventListener( 'mousemove', function( e ) {
			if ( ! thumbDragging || ! progressBar || ! progressTrack ) return;
			var visible = getTpv();
			var max     = Math.max( 1, total - visible );
			var trackW  = progressTrack.offsetWidth;
			var thumbW  = progressBar.offsetWidth;
			var travel  = trackW - thumbW;
			var delta   = e.clientX - thumbStartX;
			var pct     = ( thumbStartSlide / max ) + ( delta / travel );
			pct = Math.max( 0, Math.min( 1, pct ) );
			progressBar.style.transform = 'translateX(' + ( travel * pct ) + 'px)';
		} );

		window.addEventListener( 'mouseup', function( e ) {
			if ( ! thumbDragging ) return;
			thumbDragging = false;
			if ( progressBar ) {
				progressBar.style.cursor = 'grab';
				progressBar.style.transition = 'transform 0.35s ease';
			}
			slideTo( thumbPosToSlide( e.clientX, thumbStartX, thumbStartSlide ), true );
		} );

		window.addEventListener( 'touchmove', function( e ) {
			if ( ! thumbDragging || ! progressBar || ! progressTrack ) return;
			var visible = getTpv();
			var max     = Math.max( 1, total - visible );
			var trackW  = progressTrack.offsetWidth;
			var thumbW  = progressBar.offsetWidth;
			var travel  = trackW - thumbW;
			var delta   = e.touches[ 0 ].clientX - thumbStartX;
			var pct     = ( thumbStartSlide / max ) + ( delta / travel );
			pct = Math.max( 0, Math.min( 1, pct ) );
			progressBar.style.transform = 'translateX(' + ( travel * pct ) + 'px)';
		}, { passive: true } );

		window.addEventListener( 'touchend', function( e ) {
			if ( ! thumbDragging ) return;
			thumbDragging = false;
			if ( progressBar ) progressBar.style.transition = 'transform 0.35s ease';
			var endX = e.changedTouches[ 0 ].clientX;
			slideTo( thumbPosToSlide( endX, thumbStartX, thumbStartSlide ), true );
		} );

		function updateArrows() {
			var visible = getTpv();
			var max     = Math.max( 0, total - visible );
			if ( prevBtn ) prevBtn.style.opacity = current <= 0   ? '0.3' : '1';
			if ( nextBtn ) nextBtn.style.opacity = current >= max ? '0.3' : '1';
		}

		/* ── Events ──────────────────────────────────────────── */
		if ( prevBtn ) {
			prevBtn.addEventListener( 'click', function () {
				slideTo( current - 1, true );
			} );
		}
		if ( nextBtn ) {
			nextBtn.addEventListener( 'click', function () {
				slideTo( current + 1, true );
			} );
		}

		/* Touch / drag */
		var touchStartX = 0;
		var touchDeltaX = 0;
		var isDragging  = false;

		viewport.addEventListener( 'touchstart', function ( e ) {
			touchStartX = e.touches[ 0 ].clientX;
			isDragging  = true;
		}, { passive: true } );

		viewport.addEventListener( 'touchmove', function ( e ) {
			if ( ! isDragging ) return;
			touchDeltaX = e.touches[ 0 ].clientX - touchStartX;
		}, { passive: true } );

		viewport.addEventListener( 'touchend', function () {
			if ( ! isDragging ) return;
			isDragging = false;
			if ( Math.abs( touchDeltaX ) > 50 ) {
				slideTo( touchDeltaX < 0 ? current + 1 : current - 1, true );
			}
			touchDeltaX = 0;
		} );

		/* Mouse drag */
		var mouseStartX = 0;
		var mouseActive = false;

		viewport.addEventListener( 'mousedown', function( e ) {
			mouseStartX = e.clientX;
			mouseActive = true;
			viewport.style.cursor = 'grabbing';
		} );

		window.addEventListener( 'mousemove', function( e ) {
			if ( ! mouseActive ) return;
			var delta = e.clientX - mouseStartX;
			if ( animation !== 'fade' ) {
				var visible = getTpv();
				var gap     = 20;
				var vw      = viewport.offsetWidth;
				var tw      = ( vw - gap * ( visible - 1 ) ) / visible;
				var base    = current * ( tw + gap );
				track.style.transition = 'none';
				track.style.transform  = 'translateX(' + ( -base + delta ) + 'px)';
			}
		} );

		window.addEventListener( 'mouseup', function( e ) {
			if ( ! mouseActive ) return;
			mouseActive = false;
			viewport.style.cursor = '';
			var delta = e.clientX - mouseStartX;
			if ( Math.abs( delta ) > 50 ) {
				slideTo( delta < 0 ? current + 1 : current - 1, true );
			} else {
				slideTo( current, true );
			}
		} );

		/* Keyboard (only when focused inside the slider) */
		root.addEventListener( 'keydown', function( e ) {
			if ( e.key === 'ArrowLeft'  ) slideTo( current - 1, true );
			if ( e.key === 'ArrowRight' ) slideTo( current + 1, true );
		} );

		/* Resize */
		var resizeTimer;
		window.addEventListener( 'resize', function() {
			clearTimeout( resizeTimer );
			resizeTimer = setTimeout( function() {
				layout();
			}, 120 );
		} );

		/* Apply arrow colour */
		if ( prevBtn ) prevBtn.style.color = arrowColor;
		if ( nextBtn ) nextBtn.style.color = arrowColor;

		/* Init */
		track.style.display = 'flex';
		layout();
	}

	/* ── Boot ────────────────────────────────────────────────── */
	function boot() {
		var sliders = document.querySelectorAll( '.giant-tile-slider' );
		[].forEach.call( sliders, initSlider );
	}

	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', boot );
	} else {
		boot();
	}
} )();
