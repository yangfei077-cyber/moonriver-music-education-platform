import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

// Import TokenVault for LLM access
class TokenVault {
  private static instance: TokenVault;
  private tokens: Map<string, any> = new Map();

  static getInstance(): TokenVault {
    if (!TokenVault.instance) {
      TokenVault.instance = new TokenVault();
    }
    return TokenVault.instance;
  }

  encryptToken(token: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.TOKEN_VAULT_SECRET || 'default-secret', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  decryptToken(encryptedToken: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.TOKEN_VAULT_SECRET || 'default-secret', 'salt', 32);
    const [ivHex, encrypted] = encryptedToken.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  getToken(userId: string, tokenName: string): string | null {
    const key = `${userId}:${tokenName}`;
    const tokenData = this.tokens.get(key);
    
    if (!tokenData) {
      return null;
    }

    // Update last used timestamp
    tokenData.lastUsed = new Date().toISOString();
    this.tokens.set(key, tokenData);

    return this.decryptToken(tokenData.encryptedToken);
  }
}

// Music Education Knowledge Base with Role-Based Access
const KNOWLEDGE_BASE = {
  // Public knowledge available to all users
  public: [
    {
      id: 'basic-scales',
      title: 'Basic Music Scales',
      content: 'A musical scale is a sequence of notes arranged in ascending or descending order. The most common scales are major and minor scales.',
      category: 'theory',
      level: 'beginner'
    },
    {
      id: 'piano-basics',
      title: 'Piano Fundamentals',
      content: 'The piano has 88 keys covering seven octaves. The white keys represent natural notes (A, B, C, D, E, F, G) and black keys represent sharps and flats.',
      category: 'instruments',
      level: 'beginner'
    },
    {
      id: 'rhythm-basics',
      title: 'Understanding Rhythm',
      content: 'Rhythm is the pattern of sounds and silences in music. It includes beats, tempo, and meter.',
      category: 'theory',
      level: 'beginner'
    }
  ],
  
  // Intermediate knowledge for students and above
  intermediate: [
    {
      id: 'chord-progressions',
      title: 'Chord Progressions',
      content: 'Chord progressions are sequences of chords that create harmonic movement in music. Common progressions include I-V-vi-IV and ii-V-I.',
      category: 'harmony',
      level: 'intermediate'
    },
    {
      id: 'sight-reading',
      title: 'Sight Reading Techniques',
      content: 'Sight reading is the ability to read and perform music at first sight. Practice with simple pieces and focus on rhythm first.',
      category: 'skills',
      level: 'intermediate'
    },
    {
      id: 'guitar-techniques',
      title: 'Guitar Playing Techniques',
      content: 'Essential guitar techniques include strumming, fingerpicking, barre chords, and hammer-ons. Start with basic open chords.',
      category: 'instruments',
      level: 'intermediate'
    }
  ],
  
  // Advanced knowledge for educators and admins
  advanced: [
    {
      id: 'advanced-harmony',
      title: 'Advanced Harmony',
      content: 'Advanced harmonic concepts include extended chords (9th, 11th, 13th), altered chords, and modal interchange.',
      category: 'harmony',
      level: 'advanced'
    },
    {
      id: 'composition-techniques',
      title: 'Music Composition Techniques',
      content: 'Composition involves melody writing, harmonic progression, form, orchestration, and arrangement techniques.',
      category: 'composition',
      level: 'advanced'
    },
    {
      id: 'pedagogy',
      title: 'Music Education Pedagogy',
      content: 'Effective music teaching methods include scaffolding, differentiated instruction, and incorporating technology in music education.',
      category: 'education',
      level: 'advanced'
    }
  ],
  
  // Administrative knowledge for admins only
  admin: [
    {
      id: 'curriculum-design',
      title: 'Curriculum Design',
      content: 'Designing music curricula involves sequencing learning objectives, assessment strategies, and alignment with educational standards.',
      category: 'administration',
      level: 'admin'
    },
    {
      id: 'student-assessment',
      title: 'Student Assessment Strategies',
      content: 'Music assessment should include performance, theory, and creativity components. Use rubrics and portfolio assessments.',
      category: 'administration',
      level: 'admin'
    }
  ]
};

// RAG Pipeline Implementation
class RAGPipeline {
  private vault: TokenVault;

  constructor() {
    this.vault = TokenVault.getInstance();
  }

  // Retrieve relevant knowledge based on user role and query
  retrieveKnowledge(query: string, userRoles: string[]): any[] {
    const relevantKnowledge = [];
    
    // Always include public knowledge
    relevantKnowledge.push(...KNOWLEDGE_BASE.public);
    
    // Add role-based knowledge
    if (userRoles.includes('student')) {
      relevantKnowledge.push(...KNOWLEDGE_BASE.intermediate);
    }
    
    if (userRoles.includes('educator')) {
      relevantKnowledge.push(...KNOWLEDGE_BASE.intermediate);
      relevantKnowledge.push(...KNOWLEDGE_BASE.advanced);
    }
    
    if (userRoles.includes('admin')) {
      relevantKnowledge.push(...KNOWLEDGE_BASE.intermediate);
      relevantKnowledge.push(...KNOWLEDGE_BASE.advanced);
      relevantKnowledge.push(...KNOWLEDGE_BASE.admin);
    }

    // Simple keyword matching for retrieval (in production, use vector similarity)
    const queryLower = query.toLowerCase();
    return relevantKnowledge.filter(item => 
      item.title.toLowerCase().includes(queryLower) ||
      item.content.toLowerCase().includes(queryLower) ||
      item.category.toLowerCase().includes(queryLower)
    );
  }

  // Generate response using LLM with retrieved context
  async generateResponse(query: string, context: any[], userId: string): Promise<string> {
    // Get user's OpenAI token from vault
    const openaiToken = this.vault.getToken(userId, 'openai-api');
    
    if (!openaiToken) {
      return "I'd be happy to help with your music education question! However, I need access to an AI language model to provide detailed answers. Please add your OpenAI API token to the Token Vault to enable AI-powered responses.";
    }

    // Prepare context for the LLM
    const contextText = context.map(item => 
      `Title: ${item.title}\nContent: ${item.content}\nLevel: ${item.level}\nCategory: ${item.category}`
    ).join('\n\n');

    const systemPrompt = `You are a knowledgeable music education assistant. Use the provided context to answer questions about music theory, instruments, teaching methods, and music education. 

Context Information:
${contextText}

Guidelines:
- Provide accurate, helpful answers based on the context
- If the context doesn't contain enough information, say so
- Tailor your response to the user's apparent skill level
- Be encouraging and supportive
- Include practical examples when possible`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API error');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      
    } catch (error) {
      console.error('LLM Error:', error);
      return "I encountered an error while generating a response. Please check your OpenAI API token in the Token Vault.";
    }
  }

  // Get user's accessible knowledge summary
  getUserKnowledgeAccess(userRoles: string[]): any {
    const access = {
      public: KNOWLEDGE_BASE.public.length,
      intermediate: 0,
      advanced: 0,
      admin: 0,
      total: KNOWLEDGE_BASE.public.length
    };

    if (userRoles.includes('student')) {
      access.intermediate = KNOWLEDGE_BASE.intermediate.length;
      access.total += access.intermediate;
    }

    if (userRoles.includes('educator')) {
      access.intermediate = KNOWLEDGE_BASE.intermediate.length;
      access.advanced = KNOWLEDGE_BASE.advanced.length;
      access.total += access.intermediate + access.advanced;
    }

    if (userRoles.includes('admin')) {
      access.intermediate = KNOWLEDGE_BASE.intermediate.length;
      access.advanced = KNOWLEDGE_BASE.advanced.length;
      access.admin = KNOWLEDGE_BASE.admin.length;
      access.total += access.intermediate + access.advanced + access.admin;
    }

    return access;
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user;
  const roles = user?.['https://moonriver.com/roles'] || [];
  const userId = user?.sub;
  const { query, action } = await request.json();

  const rag = new RAGPipeline();

  try {
    switch (action) {
      case 'chat':
        if (!query) {
          return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Retrieve relevant knowledge based on user role
        const relevantKnowledge = rag.retrieveKnowledge(query, roles);
        
        // Generate AI response with retrieved context
        const aiResponse = await rag.generateResponse(query, relevantKnowledge, userId!);

        return NextResponse.json({
          success: true,
          response: aiResponse,
          contextUsed: relevantKnowledge.length,
          knowledgeAccess: rag.getUserKnowledgeAccess(roles),
          userRole: roles[0] || 'student'
        });

      case 'knowledge-access':
        // Return user's knowledge access summary
        return NextResponse.json({
          success: true,
          knowledgeAccess: rag.getUserKnowledgeAccess(roles),
          userRole: roles[0] || 'student'
        });

      case 'search-knowledge':
        if (!query) {
          return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        // Return relevant knowledge without AI generation
        const searchResults = rag.retrieveKnowledge(query, roles);
        
        return NextResponse.json({
          success: true,
          results: searchResults,
          totalResults: searchResults.length,
          knowledgeAccess: rag.getUserKnowledgeAccess(roles)
        });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('RAG Pipeline Error:', error);
    return NextResponse.json({ 
      error: 'AI Assistant error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
