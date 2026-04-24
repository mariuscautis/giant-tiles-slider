<?php
/**
 * Plugin Name: Giant Tile Slider
 * Plugin URI:  https://www.gogiant.co.uk
 * Description: A tile-based slider block with custom post type support, progress bar, and full colour controls.
 * Version:     1.0.0
 * Author:      Marius C.
 * Author URI:  https://www.gogiant.co.uk
 * License:     GPL-2.0-or-later
 * Text Domain: giant-tile-slider
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ─────────────────────────────────────────────
 * Register Custom Post Type: Tile
 * ───────────────────────────────────────────── */
function giant_tile_slider_register_cpt() {
	$labels = [
		'name'               => __( 'Tiles', 'giant-tile-slider' ),
		'singular_name'      => __( 'Tile', 'giant-tile-slider' ),
		'add_new'            => __( 'Add New Tile', 'giant-tile-slider' ),
		'add_new_item'       => __( 'Add New Tile', 'giant-tile-slider' ),
		'edit_item'          => __( 'Edit Tile', 'giant-tile-slider' ),
		'new_item'           => __( 'New Tile', 'giant-tile-slider' ),
		'view_item'          => __( 'View Tile', 'giant-tile-slider' ),
		'search_items'       => __( 'Search Tiles', 'giant-tile-slider' ),
		'not_found'          => __( 'No tiles found', 'giant-tile-slider' ),
		'not_found_in_trash' => __( 'No tiles found in Trash', 'giant-tile-slider' ),
		'menu_name'          => __( 'Tiles', 'giant-tile-slider' ),
	];

	register_post_type( 'giant_tile', [
		'labels'             => $labels,
		'public'             => true,
		'has_archive'        => false,
		'show_in_rest'       => true,
		'menu_icon'          => 'dashicons-grid-view',
		'supports'           => [ 'title', 'editor', 'thumbnail', 'excerpt', 'custom-fields' ],
		'rewrite'            => [ 'slug' => 'tiles' ],
	] );
}
add_action( 'init', 'giant_tile_slider_register_cpt' );

/* ─────────────────────────────────────────────
 * Register Block
 * ───────────────────────────────────────────── */
function giant_tile_slider_register_block() {
	register_block_type( __DIR__ . '/block.json', [
		'render_callback' => 'giant_tile_slider_render',
	] );
}
add_action( 'init', 'giant_tile_slider_register_block' );

/* ─────────────────────────────────────────────
 * REST endpoint: return published tiles
 * ───────────────────────────────────────────── */
function giant_tile_slider_rest_tiles() {
	register_rest_route( 'giant-tile-slider/v1', '/tiles', [
		'methods'             => 'GET',
		'callback'            => function() {
			$posts = get_posts( [
				'post_type'      => 'giant_tile',
				'posts_per_page' => -1,
				'post_status'    => 'publish',
				'orderby'        => 'menu_order',
				'order'          => 'ASC',
			] );
			$data = [];
			foreach ( $posts as $post ) {
				$data[] = [
					'id'    => $post->ID,
					'title' => get_the_title( $post ),
					'url'   => get_permalink( $post ),
				];
			}
			return rest_ensure_response( $data );
		},
		'permission_callback' => '__return_true',
	] );
}
add_action( 'rest_api_init', 'giant_tile_slider_rest_tiles' );

/* ─────────────────────────────────────────────
 * Server-side render
 * ───────────────────────────────────────────── */
function giant_tile_slider_render( $attrs ) {
	$source        = isset( $attrs['source'] )        ? $attrs['source']        : 'manual';
	$tiles         = isset( $attrs['tiles'] )         ? $attrs['tiles']         : [];
	$heading       = isset( $attrs['heading'] )       ? $attrs['heading']       : '';
	$subheading    = isset( $attrs['subheading'] )    ? $attrs['subheading']    : '';
	$headingColor  = isset( $attrs['headingColor'] )  ? $attrs['headingColor']  : '#0082C9';
	$subColor      = isset( $attrs['subheadingColor'] ) ? $attrs['subheadingColor'] : '#ffffff';
	$bgColor       = isset( $attrs['bgColor'] )       ? $attrs['bgColor']       : '#1a2d5a';
	$progressColor = isset( $attrs['progressColor'] ) ? $attrs['progressColor'] : '#0082C9';
	$arrowStyle    = isset( $attrs['arrowStyle'] )    ? $attrs['arrowStyle']    : 'chevron';
	$speed         = isset( $attrs['speed'] )         ? intval( $attrs['speed'] ) : 500;
	$animation     = isset( $attrs['animation'] )     ? $attrs['animation']     : 'slide';
	$tilesPerView  = isset( $attrs['tilesPerView'] )  ? intval( $attrs['tilesPerView'] ) : 4;
	$readMoreLabel = isset( $attrs['readMoreLabel'] ) ? $attrs['readMoreLabel'] : 'Read More';
	$readMoreColor = isset( $attrs['readMoreColor'] ) ? $attrs['readMoreColor'] : '#0082C9';

	// Pull from CPT if source === 'cpt'
	if ( $source === 'cpt' ) {
		$posts = get_posts( [
			'post_type'      => 'giant_tile',
			'posts_per_page' => -1,
			'post_status'    => 'publish',
			'orderby'        => 'menu_order',
			'order'          => 'ASC',
		] );
		$tiles = [];
		foreach ( $posts as $post ) {
			$tiles[] = [
				'title' => get_the_title( $post ),
				'url'   => get_permalink( $post ),
			];
		}
	}

	if ( empty( $tiles ) ) {
		return '';
	}

	$block_id = 'gts-' . uniqid();

	ob_start();
	?>
	<div
		class="giant-tile-slider"
		id="<?php echo esc_attr( $block_id ); ?>"
		data-speed="<?php echo esc_attr( $speed ); ?>"
		data-animation="<?php echo esc_attr( $animation ); ?>"
		data-tiles-per-view="<?php echo esc_attr( $tilesPerView ); ?>"
		data-progress-color="<?php echo esc_attr( $progressColor ); ?>"
		data-arrow-style="<?php echo esc_attr( $arrowStyle ); ?>"
		data-arrow-color="<?php echo esc_attr( $headingColor ); ?>"
		style="background-color:<?php echo esc_attr( $bgColor ); ?>;"
	>
		<div class="gts-inner">
			<?php if ( $heading ) : ?>
				<h2 class="gts-heading" style="color:<?php echo esc_attr( $headingColor ); ?>;"><?php echo esc_html( $heading ); ?></h2>
			<?php endif; ?>
			<?php if ( $subheading ) : ?>
				<p class="gts-subheading" style="color:<?php echo esc_attr( $subColor ); ?>;"><?php echo esc_html( $subheading ); ?></p>
			<?php endif; ?>

			<div class="gts-slider-wrap">
				<button class="gts-arrow gts-prev" aria-label="<?php esc_attr_e( 'Previous', 'giant-tile-slider' ); ?>">
					<?php echo giant_tile_slider_arrow_svg( $arrowStyle, 'prev' ); ?>
				</button>

				<div class="gts-viewport">
					<div class="gts-track">
						<?php foreach ( $tiles as $tile ) :
							$title = isset( $tile['title'] ) ? $tile['title'] : '';
							$url   = isset( $tile['url'] )   ? $tile['url']   : '#';
						?>
						<div class="gts-tile">
							<div class="gts-tile-inner">
								<h3 class="gts-tile-title"><?php echo esc_html( $title ); ?></h3>
								<a class="gts-read-more" href="<?php echo esc_url( $url ); ?>" style="color:<?php echo esc_attr( $readMoreColor ); ?>;"><?php echo esc_html( $readMoreLabel ); ?></a>
							</div>
						</div>
						<?php endforeach; ?>
					</div>
				</div>

				<button class="gts-arrow gts-next" aria-label="<?php esc_attr_e( 'Next', 'giant-tile-slider' ); ?>">
					<?php echo giant_tile_slider_arrow_svg( $arrowStyle, 'next' ); ?>
				</button>
			</div>

			<div class="gts-progress-wrap">
				<div class="gts-progress-track">
					<div class="gts-progress-bar" style="background-color:<?php echo esc_attr( $progressColor ); ?>;"></div>
				</div>
			</div>
		</div>
	</div>
	<?php
	return ob_get_clean();
}

/* ─────────────────────────────────────────────
 * Arrow SVG helper
 * ───────────────────────────────────────────── */
function giant_tile_slider_arrow_svg( $style, $dir ) {
	$is_prev = ( $dir === 'prev' );

	if ( $style === 'angle' ) {
		// Thin angled arrow (like the image)
		if ( $is_prev ) {
			return '<svg width="18" height="32" viewBox="0 0 18 32" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="16,2 2,16 16,30" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		}
		return '<svg width="18" height="32" viewBox="0 0 18 32" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="2,2 16,16 2,30" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	}

	if ( $style === 'arrow' ) {
		// Arrow with a horizontal stem
		if ( $is_prev ) {
			return '<svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="27" y1="10" x2="1" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><polyline points="10,1 1,10 10,19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
		}
		return '<svg width="28" height="20" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1" y1="10" x2="27" y2="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><polyline points="18,1 27,10 18,19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>';
	}

	if ( $style === 'circle' ) {
		if ( $is_prev ) {
			return '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="21" stroke="currentColor" stroke-width="2"/><polyline points="25,14 17,22 25,30" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		}
		return '<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="21" stroke="currentColor" stroke-width="2"/><polyline points="19,14 27,22 19,30" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	}

	// Default: chevron
	if ( $is_prev ) {
		return '<svg width="12" height="22" viewBox="0 0 12 22" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="10,2 2,11 10,20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
	}
	return '<svg width="12" height="22" viewBox="0 0 12 22" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="2,2 10,11 2,20" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
