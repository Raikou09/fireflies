import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Phone,
  TestTube,
  Send
} from "lucide-react";

export function NotificationTestPanel() {
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const testNotification = async (type: string, name: string) => {
    setTesting(type);
    try {
      const response = await apiRequest("POST", "/api/test/notifications", {
        type
      });

      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => ({ ...prev, [type]: true }));
        toast({
          title: "Test Successful!",
          description: result.message,
          variant: "default"
        });
      } else {
        throw new Error("Test failed");
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [type]: false }));
      toast({
        title: "Test Failed",
        description: `Failed to send ${name} test`,
        variant: "destructive"
      });
    } finally {
      setTesting(null);
    }
  };

  const testTypes = [
    {
      id: 'email_test',
      name: 'Email System',
      description: 'Test basic email delivery',
      icon: Mail,
      color: 'bg-blue-500'
    },
    {
      id: 'booking_confirmation',
      name: 'Booking Confirmation',
      description: 'Test booking confirmation email + SMS',
      icon: CheckCircle,
      color: 'bg-green-500'
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Notification System Testing
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test email and SMS notifications to ensure the system is working properly.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {testTypes.map((test) => {
          const Icon = test.icon;
          const isLoading = testing === test.id;
          const result = testResults[test.id];
          
          return (
            <div key={test.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${test.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium">{test.name}</h4>
                  <p className="text-sm text-gray-600">{test.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {result !== undefined && (
                  <Badge variant={result ? "default" : "destructive"}>
                    {result ? "✓ Success" : "✗ Failed"}
                  </Badge>
                )}
                
                <Button
                  onClick={() => testNotification(test.id, test.name)}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Test
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Testing Information</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Email tests will be sent to your registered email address</li>
                <li>• SMS tests require a valid Kenyan phone number in your profile</li>
                <li>• Test notifications are clearly marked as tests</li>
                <li>• No actual bookings or charges are created during testing</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Notification Features</h4>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>• Booking confirmations (Email + SMS)</li>
                <li>• Payment confirmations (Email + SMS)</li>
                <li>• Court approval notifications (Email + SMS)</li>
                <li>• Booking reminders (Email + SMS)</li>
                <li>• Vendor earnings notifications (In-app + Email)</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}