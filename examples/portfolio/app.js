import { House } from './house.js';

var app = new House({
    name: 'Haydn\'s Portfolio',
    version: '1.0.0',
    components: [
        { name: 'store', component: '/app/services/store' },
        { name: 'theme', component: '/app/services/theme' },

        { name: 'navbar', component: '/app/components/navbar' },
    ],
    navigation: {
        container: 'house',
        linkedToBrowser: true,
        pages: [
            { path: '/', component: '/app/pages/home' },
        ],
    }
});