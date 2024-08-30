document.addEventListener('DOMContentLoaded', function () {
    const sections = document.querySelectorAll('section'); // Sezioni principali
    const navLinks = document.querySelectorAll('.nav-link'); // Link nella menubar

    function activateLink() {
        let index = sections.length;

        while (--index && window.scrollY + 50 < sections[index].offsetTop) {}

        navLinks.forEach((link) => link.classList.remove('active'));
        navLinks[index].classList.add('active');
    }

    activateLink(); // Attivazione iniziale
    window.addEventListener('scroll', activateLink); // Rileva lo scroll
});
