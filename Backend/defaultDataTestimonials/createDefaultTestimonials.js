const CompanyLogo = require("../models/testimonials/CompanyLogo");
const Testimonial = require("../models/testimonials/Testimonial");

const createDefaultTestimonials = async () => {
    try {
        // Check if data exists
        const logoCount = await CompanyLogo.count();
        if (logoCount > 0) {
            console.log("Testimonial data already exists.");
            return;
        }

        // Seed Logos (Queekies)
        const queekies = await CompanyLogo.create({
            name: "Queekies",
            logo_url: "/testimonials/logos/queekies_placeholder.png",
            status: "active",
            created_by: 1,
            updated_by: 1
        });

        const dreamLMS = await CompanyLogo.create({
            name: "Queekies",
            logo_url: "/testimonials/logos/dreamlms_placeholder.png",
            status: "active",
            created_by: 1,
            updated_by: 1
        });

        console.log("Default Company Logos inserted.");

        // Seed Testimonials
        await Testimonial.bulkCreate([
            {
                author_name: "Aarav Mehta",
                author_role: "Web Development Student at Queekies",
                testimonial_text: "Queekies offers an engaging and accessible learning experience. The lessons are practical and easy to follow. Each module focuses on real-world applications. It has helped me significantly improve my web development skills.",
                company_id: queekies.id,
                status: "active",
                rating: 5,
                author_image: "/testimonials/authors/placeholder.png",
                created_by: 1,
                updated_by: 1
            },
            {
                author_name: "Sanvi Shah",
                author_role: "Software Engineering Student at Queekies",
                testimonial_text: "Queekies transformed programming from intimidating to understandable through structured lessons and projects.",
                company_id: queekies.id,
                status: "active",
                rating: 5,
                author_image: "/testimonials/authors/placeholder.png",
                created_by: 1,
                updated_by: 1
            },
            {
                author_name: "Rahul Sharma",
                author_role: "Cybersecurity Student at Queekies",
                testimonial_text: "Switching to a cybersecurity career initially felt challenging. Queekies provided clear guidance through structured courses. The learning path was easy to follow and well organized. Supportive mentors helped clarify complex concepts. Each lesson focused on practical, real-world applications.",
                company_id: queekies.id,
                status: "active",
                rating: 5,
                author_image: "/testimonials/authors/placeholder.png",
                created_by: 1,
                updated_by: 1
            },
            {
                author_name: "Priya Nair",
                author_role: "Data Science Student at Queekies",
                testimonial_text: "Balancing a full time job and learning was challenging, but Queekies gave me the flexibility I needed. I loved the hands-on data science projects!",
                company_id: queekies.id,
                status: "active",
                rating: 5,
                author_image: "/testimonials/authors/placeholder.png",
                created_by: 1,
                updated_by: 1
            },
            {
                author_name: "Neha Gupta",
                author_role: "UI/UX Design Student at Queekies",
                testimonial_text: "The learning experience at Queekies feels personalized and engaging. The feedback I received helped me improve with every project. Community support made the learning journey more collaborative. UI/UX concepts were explained clearly and practically. Each lesson boosted my confidence in design fundamentals.",
                company_id: dreamLMS.id,
                status: "active",
                rating: 5,
                author_image: "/testimonials/authors/placeholder.png",
                created_by: 1,
                updated_by: 1
            },
            {
                author_name: "Shrikant Patel",
                author_role: "iOS Development Student at Queekies",
                testimonial_text: "Queekies made iOS development easy to understand with structured lessons and hands-on app projects.",
                company_id: queekies.id,
                status: "active",
                rating: 5,
                author_image: "/testimonials/authors/placeholder.png",
                created_by: 1,
                updated_by: 1
            }
        ]);

        console.log("Default Testimonials inserted successfully.");

    } catch (error) {
        console.error("Error inserting default Testimonials:", error);
    }
};

module.exports = createDefaultTestimonials;
