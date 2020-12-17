import { House } from './house.js';

var app = new House({
    name: 'House Framework',
    version: '1.0.0',
    components: [
        { name: 'test', component: '/app/components/test' },
        { name: 'person', component: '/app/components/person' },
        { name: 'cube', component: '/app/components/hover-cube' },
    ],
    navigation: {
        container: 'house',
        linkedToBrowser: true,
        pages: [
            { path: '/', component: '/app/pages/home' },
            { path: '/login', component: '/app/pages/login' },
        ],
    }
});