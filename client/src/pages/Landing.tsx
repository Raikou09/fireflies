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
              <img 
                src="@assets/Sports Box logo_011_1755065791927.jpg" 
                alt="SportsBox Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-bold text-gray-900">SportsBox</span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => window.location.href = "/api/auth/google"}
                className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google
              </Button>
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="bg-primary hover:bg-green-700"
              >
                Sign In / Register
              </Button>
            </div>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg"
                onClick={() => window.location.href = "/api/auth/google"}
                className="bg-white text-gray-700 hover:bg-gray-100 text-lg px-8 py-4 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              <Button 
                size="lg"
                onClick={() => window.location.href = "/api/login"}
                className="bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4"
              >
                Continue with Replit
              </Button>
            </div>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.location.href = "/vendor/login"}
              className="border-white bg-transparent text-white hover:bg-white hover:text-primary text-lg px-8 py-4"
            >
              Vendor Portal
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
