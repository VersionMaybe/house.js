(function({ content }) {

    this.mode = 'click';
    this.enabled = true;

    this.hoverAllow = true;

    this.onClick = (e) => {
        if (this.enabled && this.mode === 'click') {
            const rect = content.getBoundingClientRect();
            this.startPulse(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
        }
    }

    this.onHover = (e) => {
        if (this.enabled && this.mode === 'hover' && this.hoverAllow) {
            const rect = content.getBoundingClientRect();
            this.startPulse(
                e.clientX - rect.left,
                e.clientY - rect.top
            );
            this.hoverAllow = false;
        }
    }

    this.onLeave = (e) => {
        this.hoverAllow = true;
    }

    this.startPulse = (x, y) => {
        const element = document.createElement('span');
        element.className = 'c-pulse-overlay__inner';
        content.appendChild(element);
        element.style.top = `${(y)}px`;
        element.style.left = `${(x)}px`;

        setTimeout(() => {
            element.remove();
        }, 1000);
    }

});