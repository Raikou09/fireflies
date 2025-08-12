import Navigation from "@/components/Navigation";
import AdminInterface from "@/components/AdminInterface";

export default function Admin() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <AdminInterface />
      </div>
    </div>
  );
}