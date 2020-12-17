export const House = (function(settings){
    this.name = '';
    this.version = '';
    this.instance = '';

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
                    const resp = e(...params) || null;
                    responses.push(resp);
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
        linkedToBrowser: false,
        paths: [],
        go: (path, replaceState) => {
            path = path || '/';
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

    init(this, settings);
    
    async function init(app, { name, version, components, navigation }) {
        if (!name || !version) { error('Name & Version required in house settings.'); }
        app.name = name,
        app.version = version;
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
       app.navigation.root.innerHTML = `<${component}></${component}>`;
    }

    async function loadComponent(app, { name, component }, prefix = 'app') {
        if (!customElements.get(`${prefix}-${name}`)) {
            var dirName = component.split('/')[component.split('/').length - 1];

            const componentHTML = await fetchFile(component + `/${ dirName }.html`);
            const componentJS = await fetchFile(component + `/${ dirName }.js`);
            const componentCSS = await fetchFile(component + `/${ dirName }.css`);
    
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
        requestAnimationFrame(() => {
            doChangeDetection(app);
        })
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

                    const bindProps = this.template.match(/\$\(.+?\)/gm) || [];
                    bindProps.forEach((e) => {
                        var prop = e.slice(2, -1);
                        var propNest = prop.split('.');
                        
                        var propVal = this.props;
                        propNest.forEach((x) => {
                            if (propVal[x] === undefined) {
                                error(`Property '${e.slice(2, -1)}' is not available on component '${name}'.`)
                            }
                            propVal = propVal[x];
                        });

                        virtualTemplate = virtualTemplate.replace(e, propVal);
                    });

                    const virtual = document.createElement('div');
                    virtual.innerHTML = virtualTemplate;

                    traverse(virtual, this, app);

                    function createEventBinding(event, func, element, parent, app) {
                        if(document.body.contains(parent)) {
                            element.addEventListener(event, (e) => {
                                try {
                                    window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][parent.ref][func](e);
                                } catch(e) {
                                    error(`Function '${func}' is not available on component '${parent}'`)
                                }
                            });
                        }
                        
                    }

                    function traverse(virtual, real, app) {
                        if (virtual.nodeType === Node.TEXT_NODE) {
                            if (real.nodeValue != virtual.nodeValue) {
                                real.nodeValue = virtual.nodeValue;
                            }
                        } if (virtual.nodeType === Node.ATTRIBUTE_NODE) {
                            if (real.nodeValue != virtual.nodeValue) {
                                real.nodeValue = virtual.nodeValue;
                            }
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

                                    if(created.attributes && !created.eventsInitilised) {
                                        for (let attr of created.attributes) {
                                            if (attr.nodeName.startsWith('event-')) {
                                                const eventName = attr.nodeName.slice(6);
                                                const eventFunc = attr.value.split('(')[0];
                                                let parent = real;
                                                while (!parent.ref) {
                                                    parent = parent.parentElement;
                                                }

                                                createEventBinding(eventName, eventFunc, created, parent, app);
                                            }
                                        }

                                        created.eventsInitilised = true;
                                    }

                                    if (created.content) {
                                        created.setup();
                                    }

                                    

                                    traverse(v, created, app);
                                }  else if (virtual.innerHTML !== real.innerHTML) {
                                    traverse(v, r, app);

                                    if (v.attributes) {
                                        for (let j = 0; j < v.attributes.length; j++) {
                                            r.setAttribute(v.attributes[j].nodeName, v.attributes[j].nodeValue);
                                            if (!r.eventsInitilised && v.attributes[j].nodeName.startsWith('event-')) {
                                                const eventName = v.attributes[j].nodeName.slice(6);
                                                const eventFunc = v.attributes[j].value.split('(')[0];
                                                let parent = real;
                                                while (!parent.ref) {
                                                    parent = parent.parentElement;
                                                }
                                                createEventBinding(eventName, eventFunc, r, parent, app);
                                            }
                                        }
                                        r.eventsInitilised = true;
                                        for (let j = 0; j < v.children.length; j++) {
                                            const appElement = r.children[j];
                                            if(appElement.ref) {
                                                for (let attr of appElement.attributes) {
                                                    if (attr.nodeName.startsWith('bind-')) {
                                                        var propNest = attr.value.split('.');
                                                        var propVal = real.props;
                                                        propNest.forEach((x) => {
                                                            if (!propVal[x]) {
                                                                error(`Property '${x.slice(2, -1)}' is not available on component '${name}'.`)
                                                            }
                                                            propVal = propVal[x];
                                                        });

                                                        window[`HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES`][appElement.ref][attr.value] = propVal;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
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
this.component = new ${ this.safename }(window['HOUSE_${app.instance}_CUSTOM_ELEMENTS']['${ this.ref }'].content, window['HOUSE_${app.instance}_INSTANCE']);
window['HOUSE_${app.instance}_CUSTOM_ELEMENT_RUNTIMES']['${ this.ref }'] = this.component; })()`;
                    this.meta.appendChild(script);
                }

                attachCSS(val) {
                    var style = document.createElement('style');
                    style.textContent = val;
                    this.meta.appendChild(style);
                }
            }
        );
    }

    async function fetchFile(path, settings) {
        return new Promise((res) => {
            fetch(path, settings).then(async (e) => {
                if (e.ok) {
                    res(await e.text());
                } else {
                    res({ error: e.status, message: e.statusText });
                }
            });
        });
    }

    function print(msg) {
        console.log(`[House] ` + msg)
    }

    function error(msg) {
        console.error(`[House] ` + msg)
    }

    function warning(msg) {
        console.warn(`[House] ` + msg)
    }
});