// import { House } from '../../../house.js';

(function(instance, app) {

    this.count = 1;

    // var app = new House({
    //     name: 'House Inside Framework',
    //     version: '1.0.0',
    //     components: [
    //         { name: 'square', component: '/app/components/hover-cube' },
    //     ],
    //     // navigation: {
    //     //     container: 'house',
    //     //     linkedToBrowser: true,
    //     //     pages: [
    //     //         { path: '/', component: '/app/pages/home' },
    //     //         { path: '/login', component: '/app/pages/login' },
    //     //     ],
    //     // }
    // });
    
    // console.log(app);

    app.global.listen('count', (e) => {
        console.log('Count Changed', e);
        this.count = e;
    });
    
    this.gotoLogin = () => {
        // console.log('Thing');
        app.navigation.go('/login');
    }

    this.gotoHome = () => {
        // app.navigation.go('/login');
        console.log('test')
    }
});