import SearchBar from "./SearchBar";
import CourtsGrid from "./CourtsGrid";

export default function CustomerInterface() {
  return (
    <div className="customer-interface">
      {/* Hero Section with Search */}
      <section className="bg-gradient-to-br from-primary to-secondary py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Book Sports Courts Across Kenya
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Find and book courts in Nairobi, Mombasa, Kisumu and beyond
          </p>
          
          <SearchBar />
        </div>
      </section>

      {/* Courts Grid */}
      <CourtsGrid />
    </div>
  );
}
