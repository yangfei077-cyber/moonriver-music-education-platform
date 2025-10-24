// Reusable function to get user roles from Auth0 Management API
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    console.log('=== ROLE FETCHING DEBUG ===');
    console.log('Fetching roles for userId:', userId);
    console.log('Auth0 Domain:', process.env.AUTH0_DOMAIN);
    
    // Get Management API token using client credentials
    const tokenResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.AUTH0_MANAGEMENT_CLIENT_ID,
        client_secret: process.env.AUTH0_MANAGEMENT_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: 'client_credentials',
        scope: 'read:users read:roles'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get management token:', tokenResponse.status, errorText);
      return ['student']; // Default fallback
    }

    const tokenData = await tokenResponse.json();
    const managementToken = tokenData.access_token;
    
    console.log('Management token obtained:', managementToken ? 'Present' : 'Missing');
    
    // Fetch user roles from the specific roles endpoint
    const rolesUrl = `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`;
    console.log('Fetching user roles from URL:', rolesUrl);

    const response = await fetch(rolesUrl, {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch user roles:', response.status, response.statusText, errorText);
      return ['student']; // Default fallback
    }

    const roles = await response.json();
    console.log('Raw roles response:', roles);
    
    // Extract role names from the roles array
    const roleNames = roles.map((role: any) => role.name);
    console.log('Extracted role names:', roleNames);
    console.log('========================');
    
    return roleNames;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return ['student']; // Default fallback
  }
}
