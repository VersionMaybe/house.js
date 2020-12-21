(function({ content, app, instance }) {
    
    this.title = 'Haydn Comley';
    this.sideOpen = false;
    this.sideState = false;
    
    app.global.listen('nav.isOpen', (isOpen) => {
        this.sideOpen = isOpen;
        this.sideState = isOpen ? 'open' : 'closed';
    });

    this.toggleMenu = () => {
        app.global.echo('nav.isOpen', !this.sideOpen);
    }

    this.gotoHome = () => {
        app.navigation.go('/');
        this.toggleMenu();
    }

    this.gotoAbout = () => {
        app.navigation.go('/about');
        this.toggleMenu();
    }

});