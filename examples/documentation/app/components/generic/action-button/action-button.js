this.label = 'Button';
this.enabled = true;

this.onClick = () => {
    if (this.enabled) {
        setTimeout(() => {
            instance.dispatchEvent(new Event('action'));
        }, 15);
    }
}