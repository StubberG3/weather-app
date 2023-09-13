document.addEventListener('DOMContentLoaded', function () {
    $('.nav-link').click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        var $this = $(e.target);
        var $currNavItem = $this.parent('li');
        var currPage = $currNavItem.data('nav-item');
        if (!$currNavItem.hasClass('current-page')) {
            $('*[data-nav-item]').removeClass('active');
            $currNavItem.addClass('active');
            $('*[data-page]').removeClass('current-page');
            $('[data-page="' + currPage + '"]').addClass('current-page');
        }
    })
});