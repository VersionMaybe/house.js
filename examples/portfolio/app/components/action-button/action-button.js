(function({ instance }) {

    this.label = 'Button';
    this.enabled = true;

    this.onClick = () => {
        if (this.enabled) {
            console.log('Click', this.enabled);
            instance.dispatchEvent(new Event('action'));
        }
    }

});