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

	var PanelBody     = wp.components.PanelBody;
	var PanelRow      = wp.components.PanelRow;
	var TextControl   = wp.components.TextControl;
	var SelectControl = wp.components.SelectControl;
	var RangeControl  = wp.components.RangeControl;
	var ToggleControl = wp.components.ToggleControl;
	var Button        = wp.components.Button;
	var ColorPicker   = wp.components.ColorPicker;
	var Popover       = wp.components.Popover;

	var registerBlockType = wp.blocks.registerBlockType;

	/* ── tiny colour-swatch button ───────────────────────────── */
	function ColourField( props ) {
		var label = props.label;
		var value = props.value;
		var onChange = props.onChange;
		var open = useState( false );
		var isOpen = open[0];
		var setOpen = open[1];

		return el( 'div', { style: { marginBottom: '12px' } },
			el( 'div', { style: { fontSize: '11px', fontWeight: '500', marginBottom: '4px', textTransform: 'uppercase', color: '#757575' } }, label ),
			el( 'button', {
				onClick: function() { setOpen( ! isOpen ); },
				style: {
					display: 'flex', alignItems: 'center', gap: '8px',
					background: '#fff', border: '1px solid #ccc', borderRadius: '4px',
					padding: '4px 10px', cursor: 'pointer', fontSize: '13px',
				}
			},
				el( 'span', { style: { display: 'inline-block', width: '20px', height: '20px', borderRadius: '3px', background: value, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 } } ),
				value
			),
			isOpen && el( Popover, { onClose: function() { setOpen( false ); }, placement: 'bottom-start' },
				el( 'div', { style: { padding: '8px' } },
					el( ColorPicker, {
						color: value,
						onChange: function( c ) { onChange( c ); },
					} )
				)
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

			useEffect( function() {
				if ( attrs.source !== 'cpt' ) return;
				wp.apiFetch( { path: '/giant-tile-slider/v1/tiles' } )
					.then( function( data ) { setCptData( data ); } )
					.catch( function() {} );
			}, [ attrs.source ] );

			var blockProps = useBlockProps();

			return el( Fragment, null,
				el( InspectorControls, null,

					/* Content */
					el( PanelBody, { title: __( 'Content', 'giant-tile-slider' ), initialOpen: true },
						el( SelectControl, {
							label: __( 'Tile Source', 'giant-tile-slider' ),
							value: attrs.source,
							options: [
								{ label: __( 'Manual', 'giant-tile-slider' ),            value: 'manual' },
								{ label: __( 'Custom Post Type (Tiles)', 'giant-tile-slider' ), value: 'cpt' },
							],
							onChange: function( v ) { setAttrs( { source: v } ); },
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
							__( 'No published Tiles found. Add some via Tiles → Add New.', 'giant-tile-slider' )
						),
						attrs.source === 'cpt' && cptData.length > 0 && el( 'p', { style: { color: '#555', fontSize: '12px', margin: 0 } },
							cptData.length + __( ' tile(s) found.', 'giant-tile-slider' )
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
