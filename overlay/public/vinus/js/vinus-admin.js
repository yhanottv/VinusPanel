/* Presentation only: never submit, rename, disable or replace administrative controls. */
(function () {
    'use strict';
    var language = document.body.dataset.adminLanguage || 'fr';
    try { language = localStorage.getItem('vinus:language') || language; } catch (_) {}
    var french = language === 'fr';
    document.documentElement.lang = french ? 'fr' : 'en';
    document.querySelectorAll('[data-vinus-en]').forEach(function (element) {
        element.textContent = french ? element.dataset.vinusFr : element.dataset.vinusEn;
    });
    var tabs = { About:'Informations', Details:'Détails', 'Build Configuration':'Ressources', Startup:'Démarrage', Database:'Bases de données', Databases:'Bases de données', Mounts:'Montages', Manage:'Gestion', Delete:'Suppression', Settings:'Paramètres', Configuration:'Configuration', Allocation:'Allocations', Allocations:'Allocations', Servers:'Serveurs' };
    if (french) document.querySelectorAll('.nav-tabs > li > a').forEach(function (element) {
        Array.from(element.childNodes).forEach(function (node) {
            if (node.nodeType === Node.TEXT_NODE && tabs[node.textContent.trim()]) node.textContent = tabs[node.textContent.trim()];
        });
    });
    var search = document.getElementById('vinus-admin-search');
    if (search) {
        search.placeholder = french ? 'Rechercher une rubrique' : 'Find a section';
        search.setAttribute('aria-label', search.placeholder);
        var entries = Array.from(document.querySelectorAll('.sidebar-menu > li:not(.header)'));
        var empty = document.createElement('p'); empty.className = 'vinus-menu-empty'; empty.hidden = true;
        empty.textContent = french ? 'Aucune rubrique trouvée.' : 'No matching sections.';
        empty.setAttribute('role','status'); search.parentElement.after(empty);
        search.addEventListener('input', function () {
            var term = search.value.trim().toLocaleLowerCase(); var matches = 0;
            entries.forEach(function (entry) { entry.hidden = !entry.textContent.toLocaleLowerCase().includes(term); if (!entry.hidden) matches++; });
            document.querySelectorAll('.sidebar-menu > li.header').forEach(function (header) { header.hidden = !!term; });
            empty.hidden = matches > 0;
        });
        search.addEventListener('keydown', function (event) { if (event.key === 'Escape') { search.value=''; search.dispatchEvent(new Event('input')); } });
    }
    document.querySelectorAll('.content table.table').forEach(function (table) {
        if (table.closest('.table-responsive')) return;
        var scroll = document.createElement('div'); scroll.className='table-responsive'; scroll.tabIndex=0;
        scroll.setAttribute('role','region'); scroll.setAttribute('aria-label',french?'Tableau défilant':'Scrollable table');
        table.parentNode.insertBefore(scroll,table); scroll.appendChild(table);
    });
    // Animate only the active navigation marker; keep native links and history intact.
    var active = document.querySelector('.sidebar-menu > li.active > a');
    if (active && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.innerWidth >= 768) {
        var marker = document.createElement('span'); marker.className='vinus-admin-indicator'; marker.setAttribute('aria-hidden','true');
        var place = function () { var box=active.getBoundingClientRect(); marker.style.top=(box.top+9)+'px'; marker.style.height=Math.max(0,box.height-18)+'px'; marker.hidden=document.body.classList.contains('sidebar-collapse')||active.parentElement.hidden; };
        document.body.appendChild(marker); place(); document.body.classList.add('vinus-marker-ready');
        try { var previous=Number(sessionStorage.getItem('vinus:admin-nav-y')); if(previous>0 && previous<window.innerHeight) marker.animate([{transform:'translateY('+(previous-parseFloat(marker.style.top))+'px)'},{transform:'translateY(0)'}],{duration:240,easing:'cubic-bezier(.2,.7,.2,1)'}); sessionStorage.removeItem('vinus:admin-nav-y'); } catch (_) {}
        document.querySelectorAll('.sidebar-menu > li > a').forEach(function(link){link.addEventListener('click',function(){try{sessionStorage.setItem('vinus:admin-nav-y',String(active.getBoundingClientRect().top+9));}catch(_){}});});
        window.addEventListener('resize',place); document.addEventListener('scroll',place,true);
        if(search)search.addEventListener('input',place);
        new MutationObserver(place).observe(document.body,{attributes:true,attributeFilter:['class']});
    }
})();
