this.toasts = [];

app.global.listen('toast.create', ({ title, message, duration }) => this.createToast({ title, message, duration }));

this.createToast = (options) => {
    console.log('new Toast', options);
    this.toasts.push(options)

    setTimeout(() => {
        this.toasts.splice(0, 1);
    }, options.duration || 2000);
}