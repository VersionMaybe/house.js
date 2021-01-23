export const Boxed = (function(options){

    this.global = {
        listeners: {},
        listen: (action, callback) => {
            if (this.global.listeners[action] === undefined) { this.global.listeners[action] = []; }
            this.global.listeners[action].push(callback);
            return this.global.listeners[action].length - 1;
        },
        echo: (action, ...params) => {
            return new Promise((res) => {
                let responses = [];
                (this.global.listeners[action] || []).forEach((e) => {
                    const resp = e(...params);
                    if (resp !== undefined) {
                        responses.push(resp);
                    }
                })
                res(responses.length === 0 ? undefined : responses.length === 1 ? responses[0] : responses);
            });
        },
        stop: (action, id) => {
            if (this.global.listeners[action] === undefined) { this.global.listeners[action] = []; }
            if (this.global.listeners[action][id] !== undefined) {
                this.global.listeners[action].splice(id, 1);
                return true;
            } else {
                return false;
            }
        }
    }

    this.events = {
        listeners: {},
        on: (eventName, callback) => {
            if (this.events.listeners[eventName] === undefined) { this.events.listeners[eventName] = []; }
            this.events.listeners[eventName].push(callback);
            return this.events.listeners[eventName].length - 1;
        },
        dispatch: (eventName, params) => {
            (this.events.listeners[eventName] || []).forEach((e) => e(params));
        },
        remove: (eventName, id) => {
            if (this.events.listeners[eventName] === undefined) { this.events.listeners[eventName] = []; }
            if (this.events.listeners[eventName][id] !== undefined) {
                this.events.listeners[eventName].splice(id, 1);
                return true;
            } else {
                return false;
            }
        }
    }

    this.navigation = {
        root: document,
        currentPage: null,
        transitionSpeed: 0,
        linkedToBrowser: false,
        paths: [],
        go: (path, replaceState) => {
            path = path || '/';
            if (path === window.location.pathname && !this.navigation.allowSameRouteNavigation && this.navigation.currentPage && !replaceState) {
                return;
            }
            if (!this.navigation.root) { error('This boxed instance is not setup to use navigation.'); }
            const details = this.navigation.exists(path);
            if (!details) { error(`Path ${path} does not exist or has not been setup.`); }
            if (this.navigation.linkedToBrowser) {
                if (replaceState) {
                    window.history.replaceState({}, path, window.location.origin + path)
                } else {
                    window.history.pushState({}, path, window.location.origin + path);
                }
            }
            loadPage(this, details.component);
        },
        exists: (path) => {
            return this.navigation.paths.find((x) => x.path === path) || undefined;
        }
    }

    this.grab = (path, settings, returnType = 'raw') => grab(path, settings, returnType);

    init(this, options);

    async function loadPage(app, component) {
        const newPage = document.createElement('span');
        newPage.classList.add('app-page');
        newPage.classList.add('page-in');
        app.navigation.root.appendChild(newPage);
        newPage.innerHTML = `<${component}></${component}>`;

        if (app.navigation.currentPage) {
            app.navigation.currentPage.classList.add('page-out');
        }

        setTimeout(() => {
            newPage.classList.remove('page-in');
            if (app.navigation.currentPage) {
                app.navigation.currentPage.remove();
            }
            app.navigation.currentPage = newPage;
        }, app.navigation.transitionSpeed);
    }

    function grab(path, settings, returnType = 'raw') {
        return new Promise((res) => {
            fetch(path, settings).then(async (e) => {
                if (e.ok) {
                    if (returnType === 'raw') {
                        res(e);
                    } else if (returnType === 'text') {
                        res(await e.text());
                    } else if (returnType === 'json') {
                        res(await e.json());
                    }
                } else {
                    res({ error: e.status, message: e.statusText });
                }
            });
        });
    }

    function print(msg, ...args) {
        console.log(`[Boxed] ` + msg, ...args)
    }

    function error(msg, ...args) {
        console.error(`[Boxed] ` + msg, ...args)
    }

    function warning(msg, ...args) {
        console.warn(`[Boxed] ` + msg, ...args)
    }

    function init(app, { components, updateFreqency, navigation, settings }) {
        if (!customElements.get('app-root')) {
            customElements.define('app-root', HTMLBoxedElement);
        }

        if (updateFreqency) {
            app.updateFreqency = updateFreqency;
        }

        app.settings = settings || {};

        if (navigation) {
            const root = typeof navigation.container === 'string' ? document.getElementById(navigation.container) : navigation.container;
            if (root == null) { error(`Could not find a root container '${navigation.container}'`) }
            app.navigation.root = root;
            app.navigation.linkedToBrowser = navigation.linkedToBrowser || false;
            app.navigation.transitionSpeed = navigation.transitionSpeed || 0;
            app.navigation.allowSameRouteNavigation = navigation.allowSameRouteNavigation || false;

            if (navigation.linkedToBrowser) {
                window.onpopstate = () => {
                    app.navigation.go(window.location.pathname, true);
                }
            }

            (navigation.pages || []).forEach(element => {
                let pageName = element.path.split('/').join('');
                pageName = pageName || 'home';
                loadComponent(app, {
                    name: pageName,
                    component: element.component
                }, 'page');
                app.navigation.paths.push({
                    path: element.path,
                    component: `page-${pageName}`
                });
            });
        }
    
        app.components = components;

        (components || []).forEach(element => {
            loadComponent(app, element);
        });

        app.events.dispatch('loaded', app);

        if (app.navigation.root) {
            app.navigation.go(app.navigation.linkedToBrowser ? window.location.pathname : '/');
        }
    }

    async function loadComponent(app, { name, component }, prefix = 'app') {
        if (!customElements.get(`${prefix}-${name}`)) {
            var dirName = component.split('/')[component.split('/').length - 1];

            const componentHTML = await grab(component + `/${ dirName }.html`, null, 'text');
            const componentJS = await grab(component + `/${ dirName }.js`, null, 'text');
            const componentCSS = await grab(component + `/${ dirName }.css`, null, 'text');
    
            const template = componentHTML.error ? '' : componentHTML;
            const templateJS = componentJS.error ? '' : componentJS;
            const templateStyle = componentCSS.error  ? '' : componentCSS;
            
            if (componentHTML.error) { error(`Component '${ name }' requires a HTML template file.`); }
            if (!customElements) { error('Browser does not support custom elements.'); }
            initialiseComponent({
                app,
                prefix, name,
                template, templateJS, templateStyle
            });
        } else {
            error(`A component with the name ${name} has already been defined.`);
        }
    }

    function initialiseComponent({app, prefix, name, template, templateJS, templateStyle}) {
        customElements.define(`${prefix}-${name}`, class extends HTMLBoxedElement {

            boxedRoot = this;
            boxedContent = null;

            constructor() {
                super();
                this.setup();
                this.boxedUpdateFreq = app.updateFreqency || 'frame';
                this.checkForChanges();

                if (this.parentElement) {
                    for (let i = 0; i < this.attributes.length; i++) {
                        const element = this.attributes[i];
                        
                        if (element.nodeName.startsWith('bind-')) {
                            const prop = element.nodeName.slice(5);
                            const newProp = this.boxedTranslateLogic(element.ownerElement, element.nodeValue.trim(), {});
                        
                            if (element.ownerElement[prop] != newProp) {
                                element.ownerElement[prop] = newProp;
                            }
                        }
                    }
                }
            }

            setup() {
                this.boxedRoot = this.attachShadow({mode: 'open'});
                this.boxedContent = document.createElement('div');
                this.boxedRoot.appendChild(this.boxedContent);

                this.boxedContent.className = `${prefix}-${name}-content`;
                this.boxedContent.innerHTML = template;

                const styles = document.createElement('style');
                styles.className = `${prefix}-${name}-styles`;
                styles.textContent = templateStyle;
                this.boxedRoot.appendChild(styles);
                this.stylesheet = styles;


                const templateLogic = ({ app, content, instance }) => {
                    eval(templateJS);
                };
                templateLogic({ app, content: this.boxedContent, instance: this });

                this.onUpdate();
                this.checkForChanges();
            }
        });
    }

});

function getID() {
    return parseInt(Math.random() * 1000000)
}

class HTMLBoxedElement extends HTMLElement {

    boxedReservedKeywords = ['boxedReservedKeywords', 'boxedRoot', 'autoUpdateCheck', 'boxedHistory', 'boxedUpdateFreq', 'boxedID'];
    boxedRoot = this;
    boxedContent = null;
    boxedHistory = {};
    boxedUpdateFreq = 'frame';
    autoUpdateCheck = true;

    constructor() {
        super();
    }

    checkForChanges() {
        var elementProps = Object.getOwnPropertyNames(this);
        var hasUpdates = false;

        elementProps.forEach(prop => {
            if (!this.boxedReservedKeywords.includes(prop)) {
                let val = undefined;

                if (typeof this[prop] !== 'function') {
                    const newVal = JSON.stringify(this[prop]);
                    val = JSON.parse(newVal);
                }

                if (JSON.stringify(this.boxedHistory[prop]) != JSON.stringify(val)) {
                    hasUpdates = true;
                }

                this.boxedHistory[prop] = val;
            }
        });

        if (hasUpdates) {
            this.onUpdate();
        }

        if (this.boxedUpdateFreq === 'frame') {
            requestAnimationFrame(() => {
                if (this.autoUpdateCheck) {
                    this.checkForChanges();
                }
            });
        } else {
            setTimeout(() => {
                if (this.autoUpdateCheck) {
                    this.checkForChanges();
                }
            }, this.boxedUpdateFreq);
        }
    }

    onUpdate() {
        this.boxedTraverse(this.boxedRoot);
    }

    boxedTranslateLogic(element, logic, { $event }) {
        let $value = undefined; // Used within eval statements
        let $index = undefined;

        if (logic.includes('$value') || logic.includes('$index')) {
            let testElement = element;
            let stopSearch = false;
            while(!stopSearch) {
                if (testElement.condition) {
                    $value = testElement.condition.value;
                    $index = testElement.condition.index;
                    stopSearch = true;
                } else if (testElement == document) {
                    stopSearch = true;
                }
                
                if (!stopSearch) {
                    testElement = testElement.parentElement;
                }
            }
        }
        return(eval(logic));
    }

    boxedTranslate(element, text) {
        const hasEvalRefernece = !!element[`eval-${element.boxedID}`];
        text = element[`eval-${element.boxedID}`] || text;
        const matches = text.match(/{{.+?}}/g);

        if (matches && !hasEvalRefernece) {
            element[`eval-${element.boxedID}`] = text;
        }

        if (matches) {
            matches.forEach(match => {
                const raw = match.slice(2, -2).trim();
                let $value = undefined; // Used within eval statements
                let $index = undefined;

                if (raw.includes('$value') || raw.includes('$index')) {
                    let testElement = element;
                    let stopSearch = false;
                    while(!stopSearch) {
                        if (testElement.condition) {
                            $value = testElement.condition.value;
                            $index = testElement.condition.index;
                            stopSearch = true;
                        } else if (testElement == document) {
                            stopSearch = true;
                        }
                        
                        if (!stopSearch) {
                            testElement = testElement.parentElement;
                        }
                    }
                }

                const transformed = eval(raw);
                text = text.replace(match, transformed);
            });
        }

        return text;
    }

    boxedTraverse(root = this.boxedRoot) {
        if (root.attributes) {
            for (let a = 0; a < root.attributes.length; a++) {
                const attribute = root.attributes[a];

                if (attribute.nodeName.startsWith('event-')) {
                    if (!attribute.eventExists) {
                        const event = attribute.nodeName.slice(6);
                        attribute.ownerElement.addEventListener(event, (e) => {
                            this.boxedTranslateLogic(attribute.ownerElement, attribute.nodeValue.trim(), { $event: e })
                        });
                        attribute.eventExists = true;
                    }
                } else if (attribute.nodeName.startsWith('bind-')) {
                    const prop = attribute.nodeName.slice(5);
                    const newProp = this.boxedTranslateLogic(attribute.ownerElement, attribute.nodeValue.trim(), {});
                
                    if (attribute.ownerElement[prop] != newProp) {
                        attribute.ownerElement[prop] = newProp;
                    }
                } else if (attribute.nodeName.startsWith('condition-')) {
                    if (attribute.nodeName.endsWith('-if')) {
                        attribute.ownerElement.style.display = !!this.boxedTranslateLogic(attribute.ownerElement, attribute.nodeValue.trim()) ? '' : 'none';
                    } else if (attribute.nodeName.endsWith('-count')) {
                        const count = parseInt(this.boxedTranslateLogic(attribute.ownerElement.parentElement, attribute.nodeValue.trim(), {}));
                        
                        if (!attribute.ownerElement.conditionCount) {
                            attribute.ownerElement.conditionCount = [];
                        }

                        for (let j = 1; j < attribute.ownerElement.conditionCount.length; j++) {
                            if (j >= count) {
                                attribute.ownerElement.conditionCount[j].remove();
                            }
                        }

                        attribute.ownerElement.conditionCount = attribute.ownerElement.conditionCount.splice(0, count);
                        attribute.ownerElement.style.display = count !== 0 ? '' : 'none';
                        
                        for (let j = count - 1; j > 0; j--) {
                            if (!attribute.ownerElement.conditionCount[j]) {
                                const elementCopy = attribute.ownerElement.cloneNode(true);
                                elementCopy.removeAttribute(attribute.nodeName);
                                attribute.ownerElement.after(elementCopy);
                                attribute.ownerElement.conditionCount[j] = elementCopy;
                            }    
                        }
                    } else if (attribute.nodeName.endsWith('-for')) {
                        const list = this.boxedTranslateLogic(attribute.ownerElement.parentElement, attribute.nodeValue.trim(), {}) || [];
                        const count = list.length;
                        
                        if (!attribute.ownerElement.conditionCount) {
                            attribute.ownerElement.conditionCount = [];
                        }

                        for (let j = 1; j < attribute.ownerElement.conditionCount.length; j++) {
                            if (j >= count) {
                                attribute.ownerElement.conditionCount[j].remove();
                            }
                        }

                        attribute.ownerElement.condition = { index: 0, value: list[0] };
                        attribute.ownerElement.conditionCount = attribute.ownerElement.conditionCount.splice(0, count);
                        attribute.ownerElement.style.display = count !== 0 ? '' : 'none';
                        
                        for (let j = count - 1; j > 0; j--) {
                            if (!attribute.ownerElement.conditionCount[j]) {
                                const elementCopy = attribute.ownerElement.cloneNode(true);
                                elementCopy.removeAttribute(attribute.nodeName);
                                elementCopy.condition = { index: j, value: list[j] };
                                attribute.ownerElement.after(elementCopy);
                                attribute.ownerElement.conditionCount[j] = elementCopy;
                            }    
                        }
                    }
                } else {
                    const newNodeValue = this.boxedTranslate(attribute.ownerElement, attribute.nodeValue);
                    if (attribute.nodeValue != newNodeValue) {
                        attribute.nodeValue = newNodeValue;
                    }
                }
            }
        }

        for (let i = 0; i < root.childNodes.length; i++) {
            const element = root.childNodes[i];

            if (!element.boxedID) {
                element.boxedID = getID();
            }

            if (element.nodeType === Node.TEXT_NODE) {
                const newNodeValue = this.boxedTranslate(element, element.nodeValue);
                if (element.nodeValue != newNodeValue) {
                    element.nodeValue = newNodeValue;
                }
            } else if (element.nodeType === Node.ELEMENT_NODE) {
                // Element
            }
            
            this.boxedTraverse(element);
        }
    }

}