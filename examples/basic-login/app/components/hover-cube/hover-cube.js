(function(instance) {
    this.hoverState = '';

    this.isHovering = () => {
        this.hoverState = 'hovering';
        console.log('Hover');
    }

    this.isNotHovering = () => {
        this.hoverState = '';
    }
});