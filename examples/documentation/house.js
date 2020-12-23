export const House = (function(settings){
    this.name = '';
    this.version = '';
    this.instance = '';
    this.updateFreqency = 'frame'; // set how long between detection change
    this.settings = {};

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
            if (!this.navigation.root) { error('This house instance is not setup to use navigation.'); }
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

    this.fetch = (path, settings, returnType = 'raw') => {
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

    init(this, settings);
    
    async function init(app, { name, version, components, navigation, settings = {}, updateFreqency = 'frame' }) {
        if (!name || !version) { error('Name & Version required in house settings.'); }
        app.name = name,
        app.version = version;
        app.settings = settings;
        app.updateFreqency = updateFreqency;
        app.instance = (Math.random() * 1000000).toFixed(0);
        window[`HOUSE_${app.instance}_INSTANCE`] = app;
        // window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_BASES`] = {};
        window[`HOUSE_${app.instance}_CUSTOM_ELEMENTS`] = {};
        window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`] = {};

        (components || []).forEach(element => {
            loadComponent(app, element);
        });

        if (navigation !== undefined) {
            const root = document.getElementById(navigation.container);
            if (root == null) { error(`Could not find a root container element of id '${navigation.container}'`) }
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
                let pageName = element.path.replaceAll('/', '');
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
        } else {
            app.navigation.root = undefined;
        }

        app.events.dispatch('loaded', app);

        if (app.navigation.root) {
            app.navigation.go(app.navigation.linkedToBrowser ? window.location.pathname : '/');
        }

        requestAnimationFrame(() => {
            doChangeDetection(app);
            app.events.dispatch('ready', app);
        })
    }

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

    async function loadComponent(app, { name, component }, prefix = 'app') {
        if (!customElements.get(`${prefix}-${name}`)) {
            var dirName = component.split('/')[component.split('/').length - 1];

            const componentHTML = await app.fetch(component + `/${ dirName }.html`, null, 'text');
            const componentJS = await app.fetch(component + `/${ dirName }.js`, null, 'text');
            const componentCSS = await app.fetch(component + `/${ dirName }.css`, null, 'text');
    
            const template = componentHTML.error ? '' : componentHTML;
            const templateJS = componentJS.error ? '' : componentJS;
            const templateStyle = componentCSS.error  ? '' : componentCSS;
            
            if (componentHTML.error) { error(`Component '${ name }' requires a HTML template file.`); }
            if (!customElements) { error('Browser does not support custom elements.'); }
            initialiseComponent({
                prefix,
                app,
                name,
                shadow: false,
                template,
                templateJS,
                templateStyle
            });
            app.events.dispatch('componentready', name);
        } else {
            error(`A component with the name ${name} has already been defined in another house instance`);
        }
    }

    function doChangeDetection(app) {
        var elements = Object.keys(window[`HOUSE_${app.instance}_CUSTOM_ELEMENTS`]);

        // 1) Check for changes
        for (let i = 0; i < elements.length; i++) {
            const runtime = window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][elements[i]];
            const element = window[`HOUSE_${app.instance}_CUSTOM_ELEMENTS`][elements[i]];
            const runtimeProperties = Object.getOwnPropertyNames(runtime).filter((x) => typeof runtime[x] !== 'function');

            var changesDetected = false;

            for(let property of runtimeProperties) {
                const currentValue = JSON.stringify(runtime[property]);
                const previousValue = JSON.stringify(element.props[property]);

                if (previousValue != currentValue) {
                    changesDetected = true;
                    element.props[property] = JSON.parse(currentValue);
                }
            }

            if (changesDetected) {
                element.markedForUpdate = true;
            }
        }

        // 2) Update any components that have changes
        for (let i = 0; i < elements.length; i++) {
            const element = window[`HOUSE_${app.instance}_CUSTOM_ELEMENTS`][elements[i]];
            if (element.markedForUpdate) {
                element.markedForUpdate = false;
                element.renderHTML();
            }
        }

        // 3) Repeat
        if (app.updateFreqency === 'frame') {
            requestAnimationFrame(() => {
                doChangeDetection(app);
            })
        } else {
            setTimeout(() => {
                doChangeDetection(app);
            }, Number(app.updateFreqency));
        }
        
    }

    function initialiseComponent({ name, template, templateJS, templateStyle, shadow, prefix, app }) {
        customElements.define(
            `${prefix}-${name}`,
            class extends HTMLElement {
                safename = '';
                root = this;
                content = this;
                meta = null;
                ref = undefined;
                props = {};
                stylesheet = undefined;

                template = '';
                markedForUpdate = false;
                virtual = false;

                constructor() {
                    super();
                    this.safename = name.replaceAll('-', '_');

                    this.virtual = !document.body.contains(this);
                    if (document.body.contains(this)) {
                        this.setup();
                    }
                }

                setup() {
                    this.ref = `component_${this.safename}_${(Math.random() * 1000000).toFixed(0)}`;

                    if (shadow) { 
                        this.root = this.attachShadow({mode: 'open'});
                        this.content = this.root.appendChild(document.createElement('div'));
                    } else {
                        this.content = this.appendChild(document.createElement('div'));
                    }

                    this.meta = document.createElement('meta');
                    window[`HOUSE_${app.instance}_CUSTOM_ELEMENTS`][this.ref] = this;
                    this.template = template;
                    this.attachJS(templateJS);
                    this.attachCSS(templateStyle)
                    this.root.appendChild(this.meta);
                    

                    requestAnimationFrame(() => {
                        var runtime = window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][this.ref];
                        if(!runtime) { return; }
                        var elementProps = Object.getOwnPropertyNames(runtime);

                        elementProps.forEach(prop => {
                            if (typeof runtime[prop] !== 'function') {
                                const newVal = JSON.stringify(runtime[prop]);
                                this.props[prop] = JSON.parse(newVal);
                            }
                        });
                        
                        this.renderHTML();
                    });
                }

                renderHTML() {
                    var virtualTemplate = this.template;
                    const virtual = document.createElement('div');
                    virtual.innerHTML = virtualTemplate;

                    traverse(virtual, this, app);

                    function createEventBinding(event, func, element, parent, app) {
                        if(document.body.contains(parent)) {
                            element.addEventListener(event, (e) => {
                                try {
                                    if (func.includes('(')) {
                                        app.elementEvent = e;
                                        interpretTemplateLogic(app, element, `{{ ${func} }}`);
                                        delete app.elementEvent;
                                    } else {
                                        window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][parent.ref][func](e);
                                    }
                                } catch(e) {
                                    error(`Error with '${func}' on component '${parent.nodeName}'`, e);
                                }
                            });
                        }
                        
                    }

                    function checkAttributes(element, parent, app, v, stopConditionals) {
                        if(element.attributes) {
                            for (let attr of element.attributes) {
                                if (attr.nodeName.startsWith('event-') && !element.eventsInitilised) {
                                    const eventName = attr.nodeName.slice(6);
                                    while (!parent.ref) {
                                        parent = parent.parentElement;
                                    }

                                    createEventBinding(eventName, attr.value, element, parent, app);
                                } else if (attr.nodeName.startsWith('condition-') && !stopConditionals) {
                                    while (!parent.ref) {
                                        parent = parent.parentElement;
                                    }
                                    if (attr.nodeName.endsWith('-if')) {
                                        const statement = eval(convertArgsRelative(app, parent, [attr.nodeValue], element)[0]);
                                        element.style.display = !!statement ? '' : 'none';
                                    } 
                                    if (attr.nodeName.endsWith('-for')) {
                                        element[`condition-term`] = 'value';
                                        element[`condition-logic`] = attr.nodeValue;

                                        if (attr.nodeValue.includes('of')) {
                                            element[`condition-term`] = /(.+)\sof/.exec(attr.nodeValue)[1];
                                            element[`condition-logic`] = /of\s(.+)/.exec(attr.nodeValue)[1];
                                        }

                                        const items = eval(convertArgsRelative(app, parent, [element[`condition-logic`] ], element)[0]);
                                        if (!items) {
                                            return;
                                        }

                                        if (element[`condition-count`] > items.length) {
                                            for (let i = 2; i <= element[`condition-count`]; i++) {
                                                if (i > items.length) {
                                                    element[`condition-item-${i - 1}`].remove();
                                                    element[`condition-item-${i - 1}`] = undefined;
                                                }
                                                
                                            }
                                        }


                                        element.style.display = items.length > 0 ? '' : 'none';
                                        element[`condition-item-0`] = element;

                                        if (!element[`condition-instance`]) {
                                            const inst = `condition-instance-` + (Math.random() * 1000000).toFixed(0);
                                            element[`condition-instance`] = inst;
                                            parent[inst] = {};
                                        }

                                        for(let i in items) {
                                            let currentElement = element[`condition-item-${i}`]
                                            let isNew = i == 0 || !currentElement;

                                            if (!currentElement) {
                                                currentElement = element.cloneNode(false);
                                                currentElement.removeAttribute(attr.nodeName);
                                                currentElement[`condition-term`] = element[`condition-term`];
                                                currentElement[`condition-logic`] = element[`condition-logic`];
                                                (element[`condition-item-${i - 1}`] || element).after(currentElement);    
                                            }

                                            if (isNew) {
                                                requestAnimationFrame(() => {
                                                    // currentElement.innerHTML = element.innerHTML;
                                                    traverse(v, currentElement, app);   
                                                    
                                                    if (v.attributes) {
                                                        for (let j = 0; j < v.attributes.length; j++) {
                                                            if (!v.attributes[j].nodeName.includes('condition')) {
                                                                currentElement.setAttribute(v.attributes[j].nodeName, interpretTemplateLogic(app, currentElement, v.attributes[j].nodeValue)); 

                                                            }
                                                        }
                                                        checkAttributes(currentElement, parent, app, v, i == 0);
                                                        
                                                        for (let j = 0; j < v.children.length; j++) {
                                                            const appElement = currentElement.children[j];
                                                            if(appElement.ref) {
                                                                for (let attr of appElement.attributes) {
                                                                    if (attr.nodeName.startsWith('bind-')) {
                                                                        var propNest = attr.value.split('.');
                                                                        var propVal = real.props;
                                                                        propNest.forEach((x) => {
                                                                            if (propVal[x] === undefined) {
                                                                                error(`Property '${x}' is not available on component '${name}'.`)
                                                                            }
                                                                            propVal = propVal[x];
                                                                        });
                
                                                                        window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][appElement.ref][attr.nodeName.slice(5)] = propVal;
                                                                    } else if (attr.nodeName.startsWith('set-')) {
                                                                        try {
                                                                            // const args = convertArgsRelative(app, appElement, [attr.nodeValue]);
                                                                            window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][appElement.ref][attr.nodeName.slice(4)] = interpretTemplateLogic(app, appElement, attr.nodeValue);
                                                                        } catch(e) {
                                                                            error(`Issue binding '${attr.nodeName}' to ${attr.nodeValue}. `, appElement)
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                })
                                                
                                            }

                                            element[`condition-item-${i}`]  = currentElement;
                                            currentElement['condition-instance'] = element[`condition-instance`];
                                            currentElement['condition-index'] = i;
                                            parent[element[`condition-instance`]][i] = items[i];
                                        }

                                        element[`condition-count`] = items.length;

                                    } 
                                }
                            }

                            element.eventsInitilised = true;
                        }
                    }

                    

                    function traverse(virtual, real, app) {
                        
                        try {
                            if (virtual.nodeType === Node.TEXT_NODE) {
                                real.nodeValue = interpretTemplateLogic(app, real, virtual.nodeValue);
                            } if (virtual.nodeType === Node.ATTRIBUTE_NODE) {
                                real.nodeValue = interpretTemplateLogic(app, real, virtual.nodeValue);
                                // }
                            } else if (virtual.nodeType === Node.ELEMENT_NODE) {
                                for (let i = 0; i < virtual.childNodes.length; i++) {
                                    const r = real.childNodes[i];
                                    const v = virtual.childNodes[i];

                                    if (!r) {
                                        let created = null;
                                        if (real.children[i]) {
                                            created = real.insertBefore(v.cloneNode(false), real.children[i]);
                                        } else {
                                            created = real.appendChild(v.cloneNode(false));
                                        }
    
                                        checkAttributes(created, real, app, v);
    
                                        if (created.content) {
                                            created.setup();
                                        }
                                        traverse(v, created, app);
                                    }  else if (virtual.innerHTML !== real.innerHTML) {
                                        traverse(v, r, app);
    
                                        if (v.attributes) {
                                            for (let j = 0; j < v.attributes.length; j++) {
                                                    r.setAttribute(v.attributes[j].nodeName, interpretTemplateLogic(app, r, v.attributes[j].nodeValue)); 
                                                
                                            }
                                            checkAttributes(r, real, app, v);
                                            
                                            for (let j = 0; j < v.children.length; j++) {
                                                const appElement = r.children[j];
                                                if(appElement.ref) {
                                                    for (let attr of appElement.attributes) {
                                                        if (attr.nodeName.startsWith('bind-')) {
                                                            var propNest = attr.value.split('.');
                                                            var propVal = real.props;
                                                            propNest.forEach((x) => {
                                                                if (propVal[x] === undefined) {
                                                                    error(`Property '${x}' is not available on component '${name}'.`)
                                                                }
                                                                propVal = propVal[x];
                                                            });
    
                                                            window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][appElement.ref][attr.nodeName.slice(5)] = propVal;
                                                        } else if (attr.nodeName.startsWith('set-')) {
                                                            try {
                                                                // const args = convertArgsRelative(app, appElement, [attr.nodeValue]);
                                                                window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][appElement.ref][attr.nodeName.slice(4)] = attr.nodeValue;
                                                            } catch(e) {
                                                                error(`Issue binding '${attr.nodeName}' to ${attr.nodeValue}. `, appElement)
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        } catch(e) {
                            error('Something went wrong while trying to traverse the DOM', e);
                        }
                    }
                }

                attachJS(val) {
                    var script = document.createElement('script');
                    script.textContent =
                    `var ${this.ref} = (function(){ const ${ this.safename } = 
// ### YOUR COMPONENT LOGIC ###
${val}
// ### END OF YOUR COMPONENT LOGIC ###
var args = {
    content: window['HOUSE_${app.instance}_CUSTOM_ELEMENTS']['${ this.ref }'].content,
    app: window['HOUSE_${app.instance}_INSTANCE'],
    instance: window['HOUSE_${app.instance}_CUSTOM_ELEMENTS']['${ this.ref }']
};
this.component = new ${ this.safename }(args);
window['HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES']['${ this.ref }'] = this.component; })()`;
                    this.meta.appendChild(script);
                }

                attachCSS(val) {
                    if (shadow) {
                        this.stylesheet = document.createElement('style');
                        this.stylesheet.id = 'style-' + this.safename;
                        this.stylesheet.textContent = val;
                        this.meta.appendChild(this.stylesheet);
                    } else {
                        const styleExists = document.getElementById('style-' + this.safename);
                        if(!styleExists) {
                            this.stylesheet = document.createElement('style');
                            this.stylesheet.id = 'style-' + this.safename;
                            this.stylesheet.textContent = val;
                            document.head.appendChild(this.stylesheet);
                        } else {
                            this.stylesheet = styleExists;
                        }
                    }
                }
            }
        );
    }

    function print(msg, ...args) {
        console.log(`[House] ` + msg, ...args)
    }

    function error(msg, ...args) {
        console.error(`[House] ` + msg, ...args)
    }

    function warning(msg, ...args) {
        console.warn(`[House] ` + msg, ...args)
    }

    function getFunctionArgs(func) {
        var args = /\(\s*([^)]+?)\s*\)/.exec(func);
        if (args[1]) {
            args = args[1].split(/\s*,\s*/);
        }
        return args;
    }

    function convertArgsRelative(app, element, args, node) {
        const relative = `window['HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES']['${element.ref}']`;
        const newArgs = [];

        args.forEach(e => {
            e = e.replace('this', relative);
            e = e.replace('event', `window['HOUSE_${app.instance}_INSTANCE'].elementEvent`);

            const term = 'value';
            if (e.includes('index') || e.includes(term)) {
                
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    node = node.parentElement;
                }
                let conditionalParent = node;
                while(!conditionalParent['condition-index']) {
                    conditionalParent = conditionalParent.parentElement;
                }
                e = e.replace(term, `window['HOUSE_${app.instance}_CUSTOM_ELEMENTS']['${element.ref}']['${conditionalParent['condition-instance']}'][${conditionalParent['condition-index']}]`);
                e = e.replace('index', conditionalParent['condition-index']);
            }
            newArgs.push(`eval(\`${e}\`)`);
        });
        return newArgs;
    }

    function interpretTemplateLogic(app, node, value) {
        const matches = value.match(/{{.+?}}/g);
        
        if (!matches) {
            return value;
        } else {
            let parent = node.parentElement;
            while(!parent.ref) {
                parent = parent.parentElement;
            }

            matches.forEach(match => {
                const hardMatch = match.slice(2, -2).trim();
                if (hardMatch.startsWith('value') || hardMatch.startsWith('index')) {
                    let conditionalParent = node;
                    while(!conditionalParent['condition-index']) {
                        conditionalParent = conditionalParent.parentElement;
                    }

                    value = value.replace(match, eval(convertArgsRelative(app, parent, [hardMatch], conditionalParent)[0]));
                } else {
                    value = value.replace(match, eval(convertArgsRelative(app, parent, [hardMatch], node)[0]));
                }
            });
            return value;
        }
    }
});