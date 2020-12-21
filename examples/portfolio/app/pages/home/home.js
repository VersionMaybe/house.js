(function({ app }) {

    this.allowButton = true;
    this.btnDetails = {
        label: 'Testing',
        enabled: false
    }

    this.send = () => {
        // console.log('Send');
        // app.global.echo('store.set', 'foo', { something: "testing", another: false });
        app.global.echo('theme.list').then((e) => {
            app.global.echo('theme.set', e[0]);
        });
    }

    this.get = () => {
        app.global.echo('theme.list').then((e) => {
            // console.log(e);
            app.global.echo('theme.set', e[1]);
        });
    }

    this.gotoAbout = () => {
        app.navigation.go('/about');
    }

    this.toggleButton = () => {
        console.log('Allow', this.allowButton);
        this.allowButton = !this.allowButton;
    }

});