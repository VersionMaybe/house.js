import { Boxed } from './boxed.js';

var app = new Boxed({
    services: [
        { name: 'store', component: '/app/services/store' },
        { name: 'theme', component: '/app/services/theme' },
        { name: 'file', component: '/app/services/file' },
        { name: 'media', component: '/app/services/media' },
    ],
    components: [
        // Generic Components
        { name: 'pulse-overlay', component: '/app/components/generic/pulse-overlay' },
        { name: 'action-button', component: '/app/components/generic/action-button' },
        { name: 'toast', component: '/app/components/generic/toast' },
        // Navigation Components
        { name: 'navbar', component: '/app/components/navigation/navbar' },
        { name: 'hamburger', component: '/app/components/navigation/hamburger' },
        // Page Building Components
        { name: 'page-header', component: '/app/components/page-parts/page-header' },
        { name: 'page-quote', component: '/app/components/page-parts/page-quote' },
        { name: 'page-code', component: '/app/components/page-parts/page-code' },
        { name: 'page-paragraph', component: '/app/components/page-parts/page-paragraph' },
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