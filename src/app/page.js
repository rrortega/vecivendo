"use client";

import React, { useState, useEffect } from "react";
import { client } from "@/lib/appwrite";
import { Databases, Query } from "appwrite";
import { MapPin, ArrowRight, Search, MessageCircle, ChevronLeft, ChevronRight, Sun, Moon, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AccessModal } from "@/components/access/AccessModal";
import { useRouter, useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { useTheme } from "@/context/ThemeContext";

const MOCK_RESIDENTIALS = [];

export default function LandingPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const searchParams = useSearchParams(); // Get search params
  const [residentials, setResidentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResidential, setSelectedResidential] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [faqs, setFaqs] = useState([]);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [globalConfig, setGlobalConfig] = useState({ whatsapp_asistencia: "5215555555555" });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Sync viewMode with URL params
  useEffect(() => {
    const view = searchParams.get("view");
    console.log("URL View Param:", view);
    if (view === "list" || view === "grid") {
      console.log("Setting viewMode to:", view);
      setViewMode(view);
    }
  }, [searchParams]);

  console.log("Current viewMode:", viewMode);

  useEffect(() => {
    const fetchResidentials = async () => {
      try {
        setLoading(true);
        const databases = new Databases(client);
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

        console.log('Fetching residentials from:', dbId);
        const response = await databases.listDocuments(
          dbId,
          "residenciales",
          []
        );

        console.log('Residentials response:', response);
        if (response.documents.length > 0) {
          const mapped = response.documents.map(doc => ({
            ...doc,
            name: doc.nombre,
            address: doc.direccion || "Ubicación Registrada",
            image: doc.imagen_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
          }));
          console.log('Mapped residentials:', mapped);
          setResidentials(mapped);
        } else {
          console.log('No residentials found');
        }
      } catch (error) {
        console.error("Error fetching residentials:", error);
        setResidentials(MOCK_RESIDENTIALS);
      } finally {
        setLoading(false);
      }
    };

    const fetchContentAndConfig = async () => {
      try {
        const databases = new Databases(client);
        const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE || "vecivendo-db";

        // Fetch Config
        const configRes = await databases.listDocuments(dbId, "configuracion_global", [Query.limit(1)]);
        if (configRes.documents.length > 0) {
          setGlobalConfig(configRes.documents[0]);
        }

        // Fetch FAQs
        const faqsRes = await databases.listDocuments(dbId, "contenidos", [
          Query.equal("tipo_contenido", "faqs"),
          Query.limit(5)
        ]);
        setFaqs(faqsRes.documents);

      } catch (error) {
        console.error("Error fetching content:", error);
      }
    };

    fetchResidentials();
    fetchContentAndConfig();
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredResidentials = residentials.filter(res =>
    res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const showSearchAndPagination = residentials.length > 10;
  const totalPages = Math.ceil(filteredResidentials.length / ITEMS_PER_PAGE);

  const displayedResidentials = showSearchAndPagination
    ? filteredResidentials.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : filteredResidentials;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      document.getElementById('residential-grid')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleResidentialClick = (res) => {
    const grantedAccess = JSON.parse(localStorage.getItem("granted_access") || "[]");
    if (grantedAccess.includes(res.slug)) {
      router.push(`/${res.slug}`);
      return;
    }

    setSelectedResidential(res);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="bg-primary text-white px-6 py-12 md:py-20 text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-20"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>

        <div className="relative z-10 flex flex-col items-center">
          {/* Large Centered Logo */}
          <div className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-full shadow-2xl flex items-center justify-center mb-6 p-3 transform hover:scale-105 transition-transform duration-500">
            <img
              src="/vecivendo_logo_primary.png"
              alt="Vecivendo Logo"
              className="w-full h-full object-contain rounded-full"
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-poppins">
            Bienvenido a Vecivendo
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-2">
            El marketplace exclusivo para tu comunidad.
          </p>
          <p className="text-white/80 text-base md:text-lg max-w-2xl mx-auto mb-8 font-medium">
            ✨ 100% Gratuito • Promoviendo la economia y el intercambio vecinal
          </p>

          {/* Search Bar - Conditional Rendering */}
          {showSearchAndPagination && (
            <div className="max-w-md w-full mx-auto relative animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar tu residencial..."
                className="w-full pl-12 pr-4 py-3 rounded-full text-text-main bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Residential List */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <h2 className="text-2xl font-bold text-text-main mb-8" id="residential-grid">Residenciales Disponibles</h2>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-2xl overflow-hidden shadow-sm border border-border animate-pulse"
              >
                {/* Image skeleton */}
                <div className="h-48 bg-gray-200 dark:bg-gray-700" />

                {/* Content skeleton */}
                <div className="p-5 space-y-3">
                  {/* Title skeleton */}
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />

                  {/* Address skeleton */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />

                  {/* Button skeleton */}
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Residentials Grid/List */}
            <div className={
              (viewMode === "grid" && displayedResidentials.length > 1)
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
                : "flex flex-col gap-4 mb-8"
            }>
              {displayedResidentials.map((res) => (
                <div
                  key={res.$id}
                  onClick={() => handleResidentialClick(res)}
                  className={`bg-surface rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-all cursor-pointer group ${(viewMode === "list" || displayedResidentials.length === 1) ? "flex flex-col md:flex-row md:h-48" : ""
                    }`}
                >
                  <div className={`${(viewMode === "list" || displayedResidentials.length === 1) ? "w-full md:w-48 shrink-0 h-48 md:h-auto" : "h-48"
                    } overflow-hidden relative`}>
                    <img
                      src={res.image}
                      alt={res.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                  </div>
                  <div className="p-5 flex flex-col flex-1 justify-center">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-text-main mb-1">{res.name}</h3>
                      <p className="text-sm text-text-secondary mb-4 flex items-center gap-1">
                        <MapPin size={14} />
                        {res.address}
                      </p>
                    </div>
                    <div className={`${(viewMode === "list" || displayedResidentials.length === 1) ? "md:self-end md:w-auto w-full" : "mt-auto"}`}>
                      <Button className="w-full justify-between border border-transparent bg-primary text-white hover:bg-white hover:text-primary hover:border-primary transition-all duration-300">
                        Ver marketplace
                        <ArrowRight size={18} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {showSearchAndPagination && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mb-16">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ChevronLeft size={20} />
                </Button>
                <span className="text-text-secondary font-medium">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-full w-10 h-10 p-0"
                >
                  <ChevronRight size={20} />
                </Button>
              </div>
            )}

            {filteredResidentials.length === 0 && (
              <div className="text-center py-12 text-text-secondary mb-12">
                <p>No encontramos residenciales con ese nombre.</p>
              </div>
            )}
          </>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden mb-12">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-poppins text-white dark:text-white">
              ¿Quieres que entremos a organizar el desmadre del grupo de WhatsApp de tu comunidad?
            </h2>
            <p className="text-gray-100 mb-8 text-lg font-medium">
              Vecivendo es 100% gratuito. Crear la tienda de tu comunidad es fácil y toma apenas 1 minuto.
            </p>
            <a
              href="https://wa.me/5215555555555"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg border border-transparent hover:border-white"
            >
              <MessageCircle className="w-6 h-6" />
              ¡Quiero mi comunidad en Vecivendo!
            </a>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 text-text-main">Preguntas Frecuentes</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={faq.$id} className="bg-surface rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full flex items-center justify-between p-4 text-left font-medium text-text-main hover:bg-background/50 transition-colors"
                  >
                    <span>{faq.titulo}</span>
                    {openFaqIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="p-4 pt-0 text-text-secondary text-sm leading-relaxed">
                      {faq.contenido_largo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      <AccessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        residential={selectedResidential}
      />
    </div>
  );
}
