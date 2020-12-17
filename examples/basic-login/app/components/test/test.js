(function(instance, app) {
    this.count = 1;
    this.shouldCount = false;
    this.interval = null;

    this.person = {
        age: 32,
        firstname: 'Haydn',
        lastname: 'Comley'
    }

    // console.log(app)

    this.test = () => {
        this.person.age++;
        app.global.echo('count', this.person.age);
    }
});