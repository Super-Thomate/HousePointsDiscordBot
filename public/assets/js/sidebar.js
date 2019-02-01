$('#sidebarCollapse').on('click', function () {
    // open or close navbar
    $('#sidebar, #content').toggleClass('active');
    // close dropdowns
    $('.collapse.in').toggleClass('in');
    // and also adjust aria-expanded attributes we use for the open/closed arrows
    // in our CSS
    $('a[aria-expanded=true]').attr('aria-expanded', 'false');
    // Button inner glyph
   console.log ("the <i> ", this.firstElementChild)
   $(this.firstElementChild).toggleClass ("fa-align-justify").toggleClass ("fa-times")
});