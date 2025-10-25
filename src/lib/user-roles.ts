// Reusable function to get user roles from Auth0 Management API
export async function getUserRoles(userId: string): Promise<string[]> {
  try {
    
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
        scope: 'read:users read:roles update:users'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get management token:', tokenResponse.status, errorText);
      return ['Student']; // Default fallback
    }

    const tokenData = await tokenResponse.json();
    const managementToken = tokenData.access_token;
    
    // First, get user info to check email
    const userResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      console.error('Failed to fetch user info');
      return ['Student']; // Default fallback
    }

    const userData = await userResponse.json();
    const userEmail = userData.email;

    // Check if this is a test account
    const isTestAccount = userEmail === 'admin@moonriver.com' || 
                         userEmail === 'educator@moonriver.com' || 
                         userEmail === 'student@moonriver.com';

    // Fetch user roles from the specific roles endpoint
    const rolesUrl = `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`;

    const response = await fetch(rolesUrl, {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch user roles:', response.status, response.statusText, errorText);
      
      // If user has no roles and is not a test account, assign Student role
      if (!isTestAccount) {
        console.log('Non-test account with no roles, assigning Student role to:', userEmail);
        await assignStudentRole(userId, managementToken);
        return ['Student'];
      }
      
      return ['Student']; // Default fallback
    }

    const roles = await response.json();
    
    // Extract role names from the roles array
    const roleNames = roles.map((role: any) => role.name);
    
    // If user has no roles and is not a test account, assign Student role
    if (roleNames.length === 0 && !isTestAccount) {
      console.log('Non-test account with no roles, assigning Student role to:', userEmail);
      await assignStudentRole(userId, managementToken);
      return ['Student'];
    }
    
    return roleNames;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return ['Student']; // Default fallback
  }
}

// Helper function to assign Student role to a user
async function assignStudentRole(userId: string, managementToken: string): Promise<void> {
  try {
    // First, get the Student role ID
    const rolesResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/roles`, {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!rolesResponse.ok) {
      console.error('Failed to fetch roles list');
      return;
    }

    const rolesData = await rolesResponse.json();
    const studentRole = rolesData.find((role: any) => role.name === 'Student');
    
    if (!studentRole) {
      console.error('Student role not found in Auth0');
      return;
    }

    // Assign the Student role to the user
    const assignResponse = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${userId}/roles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        roles: [studentRole.id]
      })
    });

    if (assignResponse.ok) {
      console.log('Successfully assigned Student role to user:', userId);
    } else {
      const errorText = await assignResponse.text();
      console.error('Failed to assign Student role:', errorText);
    }
  } catch (error) {
    console.error('Error assigning Student role:', error);
  }
}
