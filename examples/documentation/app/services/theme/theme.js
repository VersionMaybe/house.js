(function({ app, instance }) {

    this.themes = app.settings.theme.themes || [];
    this.darkModePreference = app.settings.theme.darkModeDefault || null;

    app.global.listen('theme.set', (theme) => this.setTheme(theme));
    app.global.listen('theme.add', (theme) => this.loadTheme(theme));
    app.global.listen('theme.list', () => { return this.availableThemes; });
    app.global.listen('theme.current', () => { return this.currentTheme });

    this.lastThemeRule = null;
    this.availableThemes = [];
    this.currentTheme = null;

    this.setTheme = (theme) => {
        if (!theme.name || !theme.properties) {
            console.error(`[Theme] Theme '${theme}' needs both a name and properties to be valid.`);
        }

        const stylesheet = instance.stylesheet.sheet;

        if (this.lastThemeRule !== null) {
            stylesheet.deleteRule(this.lastThemeRule);
            this.lastThemeRule = null;
        }
        
        let styles = '';
        Object.keys(theme.properties).forEach(e => {
            styles += e + ': ' + theme.properties[e] + ';\n';
        });

        this.lastThemeRule = stylesheet.insertRule(':root {' + styles + '}');
        this.currentTheme = theme;
    }

    this.loadTheme = (theme) => {
        this.availableThemes.push(theme);
        return true;
    }

    this.loadInitialThemes = async () => {
        for(let theme of this.themes) {
            const e = await app.fetch(theme, null, 'json');
            if (e.error) {
                console.warn('[Theme] Could not load or find theme at: ' + theme);
            } else {
                this.loadTheme(e);
            }
        }

        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.setTheme( this.availableThemes[ prefersDark ? this.darkModePreference : 0 ] || this.availableThemes[0]);
    }

    this.loadInitialThemes();
});