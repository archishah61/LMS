import { AnimatedTestimonials } from "../../ui/animated-testimonials";
import { useGetAllTestimonialsQuery } from "../../../services/Testimonials/testimonialApi";
import PrimaryLoader from "../../ui/PrimaryLoader";

const AnimatedTestimonialsDemo = () => {
    const { data: testimonialData, isLoading } = useGetAllTestimonialsQuery({ status: "active" });

    const testimonials = testimonialData?.data?.map((item) => ({
        quote: item.testimonial_text,
        name: item.author_name,
        designation: item.author_role,
        src: item.author_image
            ? (item.author_image.startsWith('http') ? item.author_image : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${item.author_image}`)
            : '/assets/placeholder_mini.png',
        company_logo: item.company?.logo_url?.startsWith('http')
            ? item.company.logo_url
            : `${import.meta.env.VITE_BACKEND_MEDIA_URL}${item.company?.logo_url || ''}`,
        rating: item.rating || 5,
    })) || [];

    if (isLoading) {
        return <PrimaryLoader />;
    }

    if (testimonials.length === 0) {
        // Fallback or empty state - technically shouldn't happen after seeding
        return null;
    }

    return <AnimatedTestimonials testimonials={testimonials} />;
};

export default AnimatedTestimonialsDemo;
