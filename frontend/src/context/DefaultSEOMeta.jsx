// src/components/seo/DefaultSeo.jsx
import { Helmet } from "react-helmet-async";
import { useGetSeoMetaByPageTypeQuery } from "../services/LegalPages/seoMetaAPI";

export default function DefaultSEOMeta() {

    const { data: seoMetaData, isLoading: seoMetaLoading, error: seoMetaError } = useGetSeoMetaByPageTypeQuery({
        page_type: "default"
    });

    // Function to get full URLs for images
    const getFullUrl = (path) => {
        if (!path) return null;
        return `${import.meta.env.VITE_BACKEND_MEDIA_URL}${path}`;
    };

    const seo = seoMetaData?.data;

    return (
        <Helmet>
            {Boolean(seo?.is_active) ? (
                <>
                    {/* Basic SEO */}
                    <title>{seo?.seo_title || "Queekies"}</title>
                    <meta name="description" content={seo?.seo_description} />
                    <meta name="keywords" content={seo?.seo_keywords} />
                    <link rel="canonical" href={seo?.canonical_url || window.location.href} />

                    {/* OG Tags */}
                    <meta property="og:title" content={seo?.og_title || seo?.seo_title} />
                    <meta property="og:description" content={seo?.og_description || seo?.seo_description} />
                    <meta property="og:image" content={getFullUrl(seo?.og_image) || getFullUrl(seo?.seo_image)} />
                    <meta property="og:image:alt" content={seo?.og_alt} />
                    <meta property="og:url" content={seo?.canonical_url || window.location.href} />
                    <meta property="og:type" content="website" />

                    {/* Optional image dimensions */}
                    {seo?.seo_image && (
                        <>
                            <meta property="og:image:width" content="1200" />
                            <meta property="og:image:height" content="630" />
                        </>
                    )}

                    {/* Twitter Tags */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content={seo?.og_title || seo?.seo_title} />
                    <meta name="twitter:description" content={seo?.og_description || seo?.seo_description} />
                    <meta name="twitter:image" content={getFullUrl(seo?.og_image) || getFullUrl(seo?.seo_image)} />
                    <meta name="twitter:image:alt" content={seo?.og_alt} />

                    {/* JSON-LD Structured Data */}
                    <script type="application/ld+json">
                        {JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "WebPage",
                            "name": seo?.seo_title,
                            "description": seo?.seo_description,
                            "url": seo?.canonical_url || window.location.href,
                            "image": getFullUrl(seo?.seo_image),
                        })}
                    </script>
                </>
            ) : (
                <>
                    {/* RESET SEO */}
                    <title>Queekies</title>
                    <meta name="description" content="" />
                    <meta name="keywords" content="" />
                    <link rel="canonical" href={window.location.href} />

                    {/* Clear OG */}
                    <meta property="og:title" content="Queekies" />
                    <meta property="og:description" content="" />
                    <meta property="og:image" content="" />
                    <meta property="og:url" content={window.location.href} />

                    {/* Clear Twitter */}
                    <meta name="twitter:card" content="summary_large_image" />
                    <meta name="twitter:title" content="Queekies" />
                    <meta name="twitter:description" content="" />
                    <meta name="twitter:image" content="" />
                </>
            )}
        </Helmet>
    );
}
