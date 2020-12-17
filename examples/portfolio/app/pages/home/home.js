(function({ app }) {

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

});