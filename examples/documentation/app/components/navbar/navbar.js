(function({ content, app, instance }) {
    
    this.icon = '/assets/img/housejs.svg';
    this.title = 'House.js - Framework';
    this.sideOpen = false;
    this.sideState = false;

    this.groups = [
        {
            label: 'General',
            items: [
                { label: 'Home', path: '/' },
                { label: 'The Basics', path: '/about' }
            ]
        },
        {
            label: 'Instructions',
            items: [
                { label: 'Components', path: '/' },
                { label: 'Data Binding', path: '/' },
                { label: 'Directives', path: '/' },
                { label: 'Navigation', path: '/' },
                { label: 'Settings', path: '/' },
            ]
        }
    ];

    
    app.global.listen('nav.isOpen', (isOpen) => {
        this.sideOpen = isOpen;
        this.sideState = isOpen ? 'open' : 'closed';
    });

    this.toggleMenu = () => {
        app.global.echo('nav.isOpen', !this.sideOpen);
    }

    this.gotoPage = (page) => {
        console.log('Open', page);
        app.navigation.go(page.path);
        app.global.echo('nav.isOpen', false);
    }

    this.open = (page) => {
        window.open(page, '_blank');
    }

});