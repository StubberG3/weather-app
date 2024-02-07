document.addEventListener('DOMContentLoaded', function () {
    function setCurrPage (e) {
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
    }
    var navEls = document.getElementsByClassName('nav-link');
    for (var i = 0; i < navEls.length; i++) {
        navEls[i].addEventListener('click', setCurrPage);
    }
    var elems = document.querySelectorAll('.dropdown-trigger');
    var instances = M.Dropdown.init(elems);
});