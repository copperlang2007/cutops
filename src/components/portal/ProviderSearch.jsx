import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, MapPin, Star, Phone, Clock, CheckCircle, 
  XCircle, Loader2, Stethoscope, Building2, Navigation
} from 'lucide-react';
import { motion } from 'framer-motion';

const specialties = [
  'Primary Care', 'Internal Medicine', 'Family Medicine', 'Cardiology',
  'Orthopedics', 'Dermatology', 'Neurology', 'Oncology', 'Ophthalmology',
  'Psychiatry', 'Pulmonology', 'Rheumatology', 'Urology', 'Gastroenterology',
  'Endocrinology', 'Physical Therapy', 'Podiatry', 'ENT', 'Allergist'
];

export default function ProviderSearch({ client, portalUser }) {
  const [searchType, setSearchType] = useState('doctor');
  const [specialty, setSpecialty] = useState('');
  const [zipCode, setZipCode] = useState(client?.zip || portalUser?.zip_code || '');
  const [distance, setDistance] = useState('10');
  const [doctorName, setDoctorName] = useState('');
  const [results, setResults] = useState(null);

  const planInfo = client?.plan_type || portalUser?.plan_type;
  const carrierInfo = client?.carrier || portalUser?.current_carrier;

  const searchMutation = useMutation({
    mutationFn: async (searchParams) => {
      const prompt = `You are a healthcare provider directory assistant. Generate realistic search results for providers.

Search criteria:
- Type: ${searchParams.type}
- Specialty: ${searchParams.specialty || 'Any'}
- Location: ${searchParams.zipCode} area
- Distance: Within ${searchParams.distance} miles
- Doctor name search: ${searchParams.doctorName || 'None'}
- Patient's Plan: ${planInfo || 'Unknown'} with ${carrierInfo || 'Unknown carrier'}

Generate 5-8 realistic provider results. For each provider, determine if they would likely be in-network for the patient's plan.

Return as JSON:
{
  "providers": [
    {
      "name": "Dr. Full Name",
      "credentials": "MD, FACP",
      "specialty": "string",
      "practice_name": "string",
      "address": "full address",
      "city": "string",
      "distance_miles": number,
      "phone": "string",
      "accepting_new_patients": true/false,
      "in_network": true/false,
      "network_status_note": "string explaining network status",
      "rating": number (1-5),
      "review_count": number,
      "languages": ["English", "Spanish"],
      "hospital_affiliations": ["string"],
      "next_available": "string date/time"
    }
  ],
  "total_in_network": number,
  "total_out_of_network": number,
  "search_tips": ["string"]
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            providers: { type: 'array', items: { type: 'object' } },
            total_in_network: { type: 'number' },
            total_out_of_network: { type: 'number' },
            search_tips: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setResults(data);
    }
  });

  const handleSearch = () => {
    searchMutation.mutate({
      type: searchType,
      specialty,
      zipCode,
      distance,
      doctorName
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="border-0 shadow-sm dark:bg-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            Find a Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {planInfo && (
            <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
              <p className="text-sm text-teal-700 dark:text-teal-300">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Showing network status for: <strong>{carrierInfo} {planInfo}</strong>
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Search Type</Label>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="specialist">Specialist</SelectItem>
                  <SelectItem value="facility">Hospital/Facility</SelectItem>
                  <SelectItem value="urgent_care">Urgent Care</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Specialty</Label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger><SelectValue placeholder="Any specialty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Any Specialty</SelectItem>
                  {specialties.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>ZIP Code</Label>
              <Input 
                value={zipCode} 
                onChange={(e) => setZipCode(e.target.value)}
                placeholder="Enter ZIP"
              />
            </div>
            <div>
              <Label>Distance</Label>
              <Select value={distance} onValueChange={setDistance}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Doctor Name (Optional)</Label>
              <Input 
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Search by name"
              />
            </div>
          </div>

          <Button 
            onClick={handleSearch}
            disabled={!zipCode || searchMutation.isPending}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {searchMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search Providers
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {results && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Found {results.providers?.length || 0} providers</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    {results.total_in_network} In-Network
                  </span>
                  <span className="flex items-center gap-1 text-sm text-amber-600">
                    <XCircle className="w-4 h-4" />
                    {results.total_out_of_network} Out-of-Network
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Results */}
      {results?.providers && (
        <div className="space-y-4">
          {results.providers.map((provider, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-0 shadow-sm dark:bg-slate-800 ${
                provider.in_network 
                  ? 'ring-2 ring-green-200 dark:ring-green-800' 
                  : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-800 dark:text-white">
                          {provider.name}
                        </h3>
                        {provider.credentials && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {provider.credentials}
                          </span>
                        )}
                        {provider.in_network ? (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            In-Network
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            Out-of-Network
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">{provider.specialty}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">{provider.practice_name}</p>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {provider.distance_miles} mi
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          {provider.rating} ({provider.review_count} reviews)
                        </span>
                        {provider.accepting_new_patients && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            Accepting New Patients
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {provider.address}
                      </p>

                      {provider.network_status_note && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                          {provider.network_status_note}
                        </p>
                      )}

                      {provider.languages?.length > 1 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Languages: {provider.languages.join(', ')}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 ml-4">
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline">
                        <Navigation className="w-4 h-4 mr-1" />
                        Directions
                      </Button>
                    </div>
                  </div>

                  {provider.next_available && (
                    <div className="mt-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Next available: {provider.next_available}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search Tips */}
      {results?.search_tips?.length > 0 && (
        <Card className="border-0 shadow-sm dark:bg-slate-800">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Search Tips:</p>
            <ul className="space-y-1">
              {results.search_tips.map((tip, idx) => (
                <li key={idx} className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}