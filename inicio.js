document.addEventListener("DOMContentLoaded", () => {
    // Selección de todos los elementos con efecto neón
    const neonElements = document.querySelectorAll(".pulse-neon");

    // Configuración del Intersection Observer para activar el brillo neón al deslizar (Scroll/Slide)
    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.25 // Se activa cuando el 25% del elemento ingresa a la pantalla del celular
    };

    const neonObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active-glow");
            } else {
                entry.target.classList.remove("active-glow");
            }
        });
    }, observerOptions);

    // Asignar observador a cada tarjeta y botón
    neonElements.forEach((el) => {
        neonObserver.observe(el);
    });
});