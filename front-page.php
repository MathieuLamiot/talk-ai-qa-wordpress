<?php
/* Template Name: Front Page */
get_header(); ?>
<section class="hero container">
  <h1>Welcome to Talk - AI for QA in WordPress</h1>
  <p>A minimal theme to showcase AI Visual Triage.</p>
  <p><a href="<?php echo esc_url(home_url('/get-started')); ?>" class="btn cta">Get Started</a></p>
</section>

<section class="hero container">
  <h1>Welcome to AI for QA in WordPress Demo</h1>
  <p>A minimal theme to showcase AI Visual Triage.</p>
  <p>
    <a href="<?php echo esc_url(home_url('/pricing')); ?>" class="btn cta">View Pricing</a>
    <a href="<?php echo esc_url(home_url('/features')); ?>" class="btn cta">See Features</a>
  </p>
</section>

<section class="container">
  <h2>Features</h2>
  <?php get_template_part('template-parts/feature-grid'); ?>
</section>
<?php get_footer(); ?>