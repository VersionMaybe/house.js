this.title = 'Boxed.js - Web Framework';
this.location = window.location;
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
            { label: 'Components', path: '/help/components' },
            { label: 'Data Binding', path: '/help/data-binding' },
            { label: 'Conditional Statements', path: '/help/conditional-statements' },
            { label: 'Services', path: '/help/services' },
            { label: 'Global Events', path: '/help/global-events' },
            { label: 'Navigation', path: '/help/navigation' },
            { label: 'Settings', path: '/help/settings' },
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

this.goHome = () => {
    app.navigation.go('/');
    app.global.echo('nav.isOpen', false);
}

this.gotoPage = (page) => {
    app.navigation.go(page.path);
    app.global.echo('nav.isOpen', false);
}

this.open = (page) => {
    window.open(page, '_blank');
}
