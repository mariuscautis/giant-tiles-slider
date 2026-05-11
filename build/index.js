/**
 * Giant Tile Slider — Editor script (no build step).
 */
( function () {
	'use strict';

	if ( ! window.wp || ! window.wp.blocks || ! window.wp.element ) return;

	var __                = wp.i18n.__;
	var el                = wp.element.createElement;
	var useState          = wp.element.useState;
	var useEffect         = wp.element.useEffect;
	var Fragment          = wp.element.Fragment;

	var useBlockProps     = wp.blockEditor.useBlockProps;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var useSettings       = wp.blockEditor.useSettings;

	var PanelBody     = wp.components.PanelBody;
	var PanelRow      = wp.components.PanelRow;
	var TextControl   = wp.components.TextControl;
	var SelectControl = wp.components.SelectControl;
	var RangeControl  = wp.components.RangeControl;
	var ToggleControl = wp.components.ToggleControl;
	var Button        = wp.components.Button;
	var ColorPicker   = wp.components.ColorPicker;
	var ColorPalette  = wp.components.ColorPalette;

	var registerBlockType = wp.blocks.registerBlockType;

	/* ── Colour field: theme palette swatches + custom picker ── */
	var CHECKERBOARD = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\'%3E%3Crect width=\'4\' height=\'4\' fill=\'%23ccc\'/%3E%3Crect x=\'4\' y=\'4\' width=\'4\' height=\'4\' fill=\'%23ccc\'/%3E%3C/svg%3E")';

	function ColourField( props ) {
		var settingsResult = useSettings( 'color.palette' );
		var rawPalette     = ( settingsResult && settingsResult[0] ) || [];
		var themePalette   = [];
		rawPalette.forEach( function( entry ) {
			if ( entry && typeof entry === 'object' && entry.color ) {
				themePalette.push( entry );
			}
		} );
		var hasPalette = themePalette.length > 0;

		var customState   = useState( ! hasPalette );
		var showCustom    = customState[0];
		var setShowCustom = customState[1];

		var isNone = ! props.value;
		var swatchStyle = {
			display: 'inline-block', width: 18, height: 18, borderRadius: 2,
			border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0,
			background: isNone ? CHECKERBOARD + ', #fff' : props.value,
		};

		return el( 'div', { style: { marginBottom: 16 } },
			el( 'p', { style: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, color: '#757575' } }, props.label ),
			el( 'div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } },
				el( 'span', { style: swatchStyle } ),
				el( 'span', { style: { fontSize: 12, color: '#444' } }, isNone ? 'None' : props.value )
			),
			hasPalette && el( ColorPalette, {
				colors:              themePalette,
				value:               props.value || '',
				onChange: function( v ) { props.onChange( v || '' ); setShowCustom( false ); },
				disableCustomColors: true,
				clearable:           true,
			} ),
			el( 'button', {
				type:    'button',
				onClick: function() { setShowCustom( ! showCustom ); },
				style:   { fontSize: 12, color: '#1a9ad6', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline', display: 'block', marginTop: 4 },
			}, showCustom ? 'Hide custom colour' : 'Custom colour…' ),
			showCustom && el( 'div', { style: { marginTop: 8, border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden' } },
				el( ColorPicker, {
					color:       props.value || '#ffffff',
					enableAlpha: true,
					onChange:    function( v ) { props.onChange( v ); },
				} )
			)
		);
	}

	/* ── tile list editor ────────────────────────────────────── */
	function TileList( props ) {
		var tiles    = props.tiles;
		var onChange = props.onChange;

		function update( idx, key, val ) {
			var next = tiles.map( function( t, i ) {
				if ( i !== idx ) return t;
				var copy = Object.assign( {}, t );
				copy[ key ] = val;
				return copy;
			} );
			onChange( next );
		}

		function remove( idx ) {
			onChange( tiles.filter( function( _, i ) { return i !== idx; } ) );
		}

		function add() {
			onChange( tiles.concat( [ { title: '', url: '' } ] ) );
		}

		return el( Fragment, null,
			tiles.map( function( tile, idx ) {
				return el( 'div', {
					key: idx,
					style: {
						border: '1px solid #e0e0e0', borderRadius: '6px',
						padding: '10px', marginBottom: '8px', background: '#fafafa',
					}
				},
					el( 'div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } },
						el( 'strong', { style: { fontSize: '12px', color: '#555' } }, __( 'Tile', 'giant-tile-slider' ) + ' ' + ( idx + 1 ) ),
						el( Button, {
							isDestructive: true,
							variant: 'tertiary',
							onClick: function() { remove( idx ); },
							style: { fontSize: '11px', padding: '2px 6px' },
						}, '✕' )
					),
					el( TextControl, {
						label: __( 'Title', 'giant-tile-slider' ),
						value: tile.title || '',
						onChange: function( v ) { update( idx, 'title', v ); },
					} ),
					el( TextControl, {
						label: __( 'URL', 'giant-tile-slider' ),
						value: tile.url || '',
						onChange: function( v ) { update( idx, 'url', v ); },
					} )
				);
			} ),
			el( Button, {
				variant: 'secondary',
				onClick: add,
				style: { width: '100%', justifyContent: 'center', marginTop: '4px' },
			}, __( '+ Add Tile', 'giant-tile-slider' ) )
		);
	}

	/* ── editor preview ──────────────────────────────────────── */
	function EditorPreview( props ) {
		var a = props.attrs;
		var tiles = a.source === 'cpt' ? props.cptTiles : a.tiles;

		var tpv = Math.max( 1, a.tilesPerView );
		var tileWidth = ( 100 / tpv ) + '%';
		var gap = 20;

		return el( 'div', {
			style: {
				background: a.bgColor,
				padding: '40px 20px',
				borderRadius: '4px',
				position: 'relative',
			}
		},
			a.heading && el( 'h2', {
				style: { color: a.headingColor, margin: '0 0 8px', fontSize: '28px', fontWeight: '700' }
			}, a.heading ),
			a.subheading && el( 'p', {
				style: { color: a.subheadingColor, margin: '0 0 28px', fontWeight: '600', fontSize: '16px' }
			}, a.subheading ),
			el( 'div', { style: { position: 'relative', display: 'flex', alignItems: 'center' } },
				el( 'div', {
					style: {
						color: a.headingColor, opacity: 0.85, fontSize: '28px',
						marginRight: '12px', userSelect: 'none', cursor: 'pointer',
					}
				}, '‹' ),
				el( 'div', { style: { flex: 1, overflow: 'hidden' } },
					el( 'div', { style: { display: 'flex', gap: gap + 'px' } },
						( tiles || [] ).slice( 0, tpv ).map( function( tile, idx ) {
							return el( 'div', {
								key: idx,
								style: {
									background: '#fff', borderRadius: '8px', padding: '24px 20px',
									flex: '0 0 calc(' + tileWidth + ' - ' + ( gap * ( tpv - 1 ) / tpv ) + 'px)',
									minHeight: '180px', display: 'flex', flexDirection: 'column',
									justifyContent: 'space-between', boxSizing: 'border-box',
								}
							},
								el( 'h3', { style: { color: '#1a2d5a', margin: '0 0 auto', fontSize: '20px', fontWeight: '700' } }, tile.title || '' ),
								el( 'a', { style: { color: a.readMoreColor, fontWeight: '600', fontSize: '14px', textDecoration: 'none', marginTop: '20px', display: 'block' } }, a.readMoreLabel || 'Read More' )
							);
						} )
					)
				),
				el( 'div', {
					style: {
						color: a.headingColor, opacity: 0.85, fontSize: '28px',
						marginLeft: '12px', userSelect: 'none', cursor: 'pointer',
					}
				}, '›' )
			),
			el( 'div', { style: { marginTop: '28px', padding: '0 40px' } },
				el( 'div', { style: { position: 'relative', height: '4px', background: 'rgba(255,255,255,0.35)', borderRadius: '2px' } },
					el( 'div', {
						style: {
							position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
							height: '14px', width: '80px',
							background: a.progressColor, borderRadius: '3px',
						}
					} )
				)
			)
		);
	}

	/* ── register block ──────────────────────────────────────── */
	registerBlockType( 'giant-tile-slider/tile-slider', {
		edit: function( props ) {
			var attrs     = props.attributes;
			var setAttrs  = props.setAttributes;
			var cptTiles  = useState( [] );
			var cptData   = cptTiles[0];
			var setCptData = cptTiles[1];
			var postTypes = useState( [] );
			var postTypeOptions = postTypes[0];
			var setPostTypeOptions = postTypes[1];

			// Fetch available public post types once when CPT mode is first used.
			useEffect( function() {
				if ( attrs.source !== 'cpt' ) return;
				if ( postTypeOptions.length > 0 ) return;
				wp.apiFetch( { path: '/giant-tile-slider/v1/post-types' } )
					.then( function( data ) { setPostTypeOptions( data ); } )
					.catch( function() {} );
			}, [ attrs.source ] );

			// Fetch posts whenever source is CPT or the chosen post type changes.
			useEffect( function() {
				if ( attrs.source !== 'cpt' ) return;
				var pt = attrs.cptType || 'giant_tile';
				wp.apiFetch( { path: '/giant-tile-slider/v1/tiles?post_type=' + encodeURIComponent( pt ) } )
					.then( function( data ) { setCptData( data ); } )
					.catch( function() {} );
			}, [ attrs.source, attrs.cptType ] );

			var blockProps = useBlockProps();

			return el( Fragment, null,
				el( InspectorControls, null,

					/* Content */
					el( PanelBody, { title: __( 'Content', 'giant-tile-slider' ), initialOpen: true },
						el( SelectControl, {
							label: __( 'Tile Source', 'giant-tile-slider' ),
							value: attrs.source,
							options: [
								{ label: __( 'Manual', 'giant-tile-slider' ),       value: 'manual' },
								{ label: __( 'Custom Post Type', 'giant-tile-slider' ), value: 'cpt' },
							],
							onChange: function( v ) { setAttrs( { source: v } ); },
						} ),
						attrs.source === 'cpt' && el( SelectControl, {
							label: __( 'Post Type', 'giant-tile-slider' ),
							value: attrs.cptType || 'giant_tile',
							options: postTypeOptions.length > 0
								? postTypeOptions
								: [ { label: __( 'Loading…', 'giant-tile-slider' ), value: attrs.cptType || 'giant_tile' } ],
							onChange: function( v ) { setAttrs( { cptType: v } ); },
						} ),
						el( TextControl, {
							label: __( 'Heading', 'giant-tile-slider' ),
							value: attrs.heading,
							onChange: function( v ) { setAttrs( { heading: v } ); },
						} ),
						el( TextControl, {
							label: __( 'Subheading', 'giant-tile-slider' ),
							value: attrs.subheading,
							onChange: function( v ) { setAttrs( { subheading: v } ); },
						} ),
						el( TextControl, {
							label: __( '"Read More" Label', 'giant-tile-slider' ),
							value: attrs.readMoreLabel,
							onChange: function( v ) { setAttrs( { readMoreLabel: v } ); },
						} ),
						attrs.source === 'manual' && el( PanelRow, null,
							el( 'div', { style: { width: '100%' } },
								el( 'p', { style: { margin: '0 0 8px', fontWeight: '600', fontSize: '12px' } }, __( 'Tiles', 'giant-tile-slider' ) ),
								el( TileList, {
									tiles: attrs.tiles,
									onChange: function( v ) { setAttrs( { tiles: v } ); },
								} )
							)
						),
						attrs.source === 'cpt' && cptData.length === 0 && el( 'p', { style: { color: '#888', fontSize: '12px', margin: 0 } },
							__( 'No published posts found for this post type.', 'giant-tile-slider' )
						),
						attrs.source === 'cpt' && cptData.length > 0 && el( 'p', { style: { color: '#555', fontSize: '12px', margin: 0 } },
							cptData.length + __( ' post(s) found.', 'giant-tile-slider' )
						)
					),

					/* Colours */
					el( PanelBody, { title: __( 'Colours', 'giant-tile-slider' ), initialOpen: false },
						el( ColourField, { label: __( 'Background', 'giant-tile-slider' ),       value: attrs.bgColor,         onChange: function(v){ setAttrs({bgColor:v}); } } ),
						el( ColourField, { label: __( 'Heading',    'giant-tile-slider' ),       value: attrs.headingColor,    onChange: function(v){ setAttrs({headingColor:v}); } } ),
						el( ColourField, { label: __( 'Subheading', 'giant-tile-slider' ),       value: attrs.subheadingColor, onChange: function(v){ setAttrs({subheadingColor:v}); } } ),
						el( ColourField, { label: __( 'Progress Bar','giant-tile-slider' ),      value: attrs.progressColor,   onChange: function(v){ setAttrs({progressColor:v}); } } ),
						el( ColourField, { label: __( '"Read More" colour', 'giant-tile-slider' ), value: attrs.readMoreColor, onChange: function(v){ setAttrs({readMoreColor:v}); } } )
					),

					/* Slider Settings */
					el( PanelBody, { title: __( 'Slider Settings', 'giant-tile-slider' ), initialOpen: false },
						el( RangeControl, {
							label: __( 'Tiles Visible (Desktop)', 'giant-tile-slider' ),
							value: attrs.tilesPerView,
							min: 1, max: 6,
							onChange: function( v ) { setAttrs( { tilesPerView: v } ); },
						} ),
						el( SelectControl, {
							label: __( 'Slide Animation', 'giant-tile-slider' ),
							value: attrs.animation,
							options: [
								{ label: __( 'Slide', 'giant-tile-slider' ),  value: 'slide' },
								{ label: __( 'Fade',  'giant-tile-slider' ),  value: 'fade' },
							],
							onChange: function( v ) { setAttrs( { animation: v } ); },
						} ),
						el( RangeControl, {
							label: __( 'Transition Speed (ms)', 'giant-tile-slider' ),
							value: attrs.speed,
							min: 100, max: 1500, step: 50,
							onChange: function( v ) { setAttrs( { speed: v } ); },
						} ),
						el( SelectControl, {
							label: __( 'Arrow Style', 'giant-tile-slider' ),
							value: attrs.arrowStyle,
							options: [
								{ label: __( 'Angle (< >)',   'giant-tile-slider' ), value: 'angle' },
								{ label: __( 'Chevron',       'giant-tile-slider' ), value: 'chevron' },
								{ label: __( 'Arrow (←→)',    'giant-tile-slider' ), value: 'arrow' },
								{ label: __( 'Circle',        'giant-tile-slider' ), value: 'circle' },
							],
							onChange: function( v ) { setAttrs( { arrowStyle: v } ); },
						} )
					)
				),

				/* Editor preview */
				el( 'div', blockProps,
					el( EditorPreview, { attrs: attrs, cptTiles: cptData } )
				)
			);
		},

		save: function() {
			return null; // server-side render
		},
	} );
} )();
