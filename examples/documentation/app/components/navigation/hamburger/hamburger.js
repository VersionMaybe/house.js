this.state = 'closed';

app.global.listen('nav.isOpen', (isOpen) => {
    this.state = isOpen ? 'open' : 'closed';
});