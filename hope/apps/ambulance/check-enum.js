const { createClient } = require('@supabase/supabase-js');

// Hardcoded for this script only to avoid dotenv dependency
const supabaseUrl = "https://xhtvjfcpidqgnahfevwd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodHZqZmNwaWRxZ25haGZldndkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjcxMDQ1MSwiZXhwIjoyMDc4Mjg2NDUxfQ.k780NC_PMVEFbwKo_s0c8q44XR7DV6rsM-ezMvV5BAk";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnums() {
    console.log("Checking existing triage levels...");
    const { data, error } = await supabase
        .from('emergencies')
        .select('triage_level')
        .not('triage_level', 'is', null)
        .limit(5);

    if (error) {
        console.error("Error fetching data:", error);
    } else {
        console.log("Existing triage_level values:", data);
    }
}

checkEnums();
