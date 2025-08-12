import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volleyball, MapPin, Clock, Shield, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      {/* Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Volleyball className="text-primary text-2xl" />
              <span className="text-xl font-bold text-gray-900">CourtBook</span>
              <span className="text-sm bg-primary text-white px-2 py-1 rounded-full">KE</span>
            </div>
            
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-primary hover:bg-green-700"
            >
              Sign In / Register
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Book Sports Courts Across Kenya
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Connect with local court owners in Nairobi, Mombasa, Kisumu and beyond. 
            Easy booking, secure payments with M-Pesa.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4"
            >
              Start Booking Courts
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = "/api/login"}
              className="border-white bg-transparent text-white hover:bg-white hover:text-primary text-lg px-8 py-4"
            >
              List Your Court
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <MapPin className="h-12 w-12 text-white mx-auto mb-4" />
                <CardTitle className="text-white">Location-Based Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100">
                  Find courts near you across major Kenyan cities with smart location filtering.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <Clock className="h-12 w-12 text-white mx-auto mb-4" />
                <CardTitle className="text-white">Real-Time Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100">
                  Book available time slots instantly with live calendar updates and confirmations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <Shield className="h-12 w-12 text-white mx-auto mb-4" />
                <CardTitle className="text-white">Secure M-Pesa Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100">
                  Pay safely with M-Pesa integration designed for Kenyan mobile money users.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-blue-100">Courts Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">5</div>
              <div className="text-blue-100">Major Cities</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-3xl font-bold text-white mb-2">
                4.8 <Star className="h-6 w-6 text-yellow-400 ml-1" />
              </div>
              <div className="text-blue-100">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
