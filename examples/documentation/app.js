import { Boxed } from './boxed.js';

var app = new Boxed({
    services: [
        { name: 'store', component: '/app/services/store' },
        { name: 'theme', component: '/app/services/theme' },
    ],
    components: [
        // Generic Components
        { name: 'pulse-overlay', component: '/app/components/generic/pulse-overlay' },
        { name: 'action-button', component: '/app/components/generic/action-button' },
        // Navigation Components
        { name: 'navbar', component: '/app/components/navigation/navbar' },
        { name: 'hamburger', component: '/app/components/navigation/hamburger' },
    ],
    navigation: {
        container: 'house',
        transitionSpeed: 500,
        linkedToBrowser: true,
        fallback: '/app/pages/error',
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
    },
});

console.log(app);