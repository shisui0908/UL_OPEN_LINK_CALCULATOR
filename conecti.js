document.addEventListener('DOMContentLoaded', function() {
    // Pequeña animación de entrada para las secciones (opcional)
    const sections = document.querySelectorAll('.info-section');
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // 10% de la sección visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Deja de observar una vez animado
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        section.style.opacity = '0'; // Inicia invisible
        section.style.transform = 'translateY(20px)'; // Ligeramente abajo
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(section);
    });

    // Funcionalidad para los botones "Saber Más"
    window.showMoreInfo = function(elementId) {
        const infoElement = document.getElementById(elementId);
        if (infoElement) {
            if (infoElement.style.display === 'block') {
                infoElement.style.display = 'none';
            } else {
                infoElement.style.display = 'block';
            }
        }
    }

    // Podrías añadir más interacciones aquí
    // Ejemplo: efecto hover en las .interactive-box podría hacerse con JS si se quiere más complejidad
    const interactiveBoxes = document.querySelectorAll('.interactive-box');
    interactiveBoxes.forEach(box => {
        box.addEventListener('mouseenter', () => {
            // Podrías cambiar algo más que con CSS hover si es necesario
        });
        box.addEventListener('mouseleave', () => {
            // Revertir cambios
        });
    });

});