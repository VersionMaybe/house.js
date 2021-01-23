app.global.listen('store.set', (key, value) => this.setValue(key, value));
app.global.listen('store.get', (key) => this.getValue(key));

this.vault = {};

this.setValue = (key, value) => {
    this.vault[key] = value;
}

this.getValue = (key) => {
    return this.vault[key] || null;
}