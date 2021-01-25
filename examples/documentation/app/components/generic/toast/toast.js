this.toasts = [];

app.global.listen('toast.create', ({ title, message }) => this.createToast({ title, message }));

this.createToast = (options) => {
    this.toasts.push(options)

    setTimeout(() => {
        this.toasts.splice(0, 1);
    }, 2500);
}