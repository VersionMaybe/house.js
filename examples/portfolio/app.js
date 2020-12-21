import { House } from './house.js';

var app = new House({
    name: 'Haydn\'s Portfolio',
    version: '1.0.0',
    components: [
        { name: 'store', component: '/app/services/store' },
        { name: 'theme', component: '/app/services/theme' },

        { name: 'navbar', component: '/app/components/navbar' },
        { name: 'hamburger', component: '/app/components/hamburger' },
        { name: 'action-button', component: '/app/components/action-button' },
    ],
    navigation: {
        container: 'house',
        transitionSpeed: 500,
        linkedToBrowser: true,
        pages: [
            { path: '/', component: '/app/pages/home' },
            { path: '/about', component: '/app/pages/about' },
        ],
    },
    settings: {
        theme: {
            themes: [
                '/assets/json/theme-light.json',
                '/assets/json/theme-dark.json'
            ],
            darkModeDefault: 1
        }
    }
});