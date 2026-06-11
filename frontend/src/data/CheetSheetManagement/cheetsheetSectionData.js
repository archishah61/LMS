const cheetsheetSectionData = {
  id: 'cheetsheet-section',
  name: 'CheetSheet Section',
  description: 'The CheetSheet Section API provides endpoints to manage cheat sheet sections in the system. These endpoints allow you to create, read, update, and delete cheat sheet sections, including handling section images.',
  endpoints: [
    {
      id: 'get-all-cheetsheet-sections',
      name: 'Get All CheetSheet Sections',
      method: 'GET',
      url: '/cheat-sheets/main-section/section/',
      description: 'Get a list of all cheat sheet sections in the system.',
      responses: [
        {
          status: 200,
          description: 'Successfully retrieved all cheat sheet sections',
          example: [
            {
              "id": 1,
              "title": "section1a",
              "contentType": "text",
              "content": "demo11",
              "sectionImage": null,
              "mainSectionId": 1,
              "created_at": "2025-05-12T14:28:26.000Z",
              "updated_at": "2025-05-12T14:28:26.000Z"
            },
            {
              "id": 2,
              "title": "section2a",
              "contentType": "text",
              "content": "demo12",
              "sectionImage": null,
              "mainSectionId": 1,
              "created_at": "2025-05-12T14:28:27.000Z",
              "updated_at": "2025-05-12T14:28:27.000Z"
            }
          ]
        }
      ]
    },
    {
      id: 'get-cheetsheet-section-by-id',
      name: 'Get CheetSheet Section By ID',
      method: 'GET',
      url: '/cheat-sheets/main-section/section/{id}',
      description: 'Get a specific cheat sheet section by its ID.',
      parameters: [
        {
          name: 'id',
          type: 'number',
          required: true,
          inPath: true,
          description: 'The ID of the cheat sheet section to retrieve',
          example: '1'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Successfully retrieved the cheat sheet section',
          example: {
            "id": 1,
            "title": "section1a",
            "contentType": "text",
            "content": "demo11",
            "sectionImage": null,
            "mainSectionId": 1,
            "created_at": "2025-05-12T14:28:26.000Z",
            "updated_at": "2025-05-12T14:28:26.000Z"
          }
        },
        {
          status: 404,
          description: 'Cheat sheet section not found',
          example: {
            "success": false,
            "message": "Cheat sheet section not found"
          }
        }
      ]
    },
    {
      id: 'create-cheetsheet-section',
      name: 'Create CheetSheet Section',
      method: 'POST',
      url: '/cheat-sheets/main-section/section/create',
      description: 'Create a new cheat sheet section in the system. For image content, upload the image using Postman form data.',
      parameters: [
        {
          name: 'title',
          type: 'string',
          required: true,
          description: 'Title of the cheat sheet section',
          example: 'demo4'
        },
        {
          name: 'contentType',
          type: 'string',
          required: true,
          description: 'Type of content (text or image)',
          example: 'text'
        },
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Content of the section',
          example: 'demoo123'
        },
        {
          name: 'mainSectionId',
          type: 'number',
          required: true,
          description: 'ID of the main section this belongs to',
          example: 4
        },
        {
          name: 'sectionImage',
          type: 'file',
          required: false,
          description: 'Image file to upload (if contentType is image)',
          example: 'image.png'
        }
      ],
      responses: [
        {
          status: 201,
          description: 'Cheat sheet section created successfully',
          example: {
            "id": 6,
            "title": "demo4",
            "contentType": "text",
            "content": "demoo123",
            "sectionImage": null,
            "mainSectionId": 4,
            "created_at": "2025-05-12T14:53:48.000Z",
            "updated_at": "2025-05-12T14:53:48.000Z"
          }
        },
        {
          status: 400,
          description: 'Validation error',
          example: {
            "success": false,
            "message": "Title is required"
          }
        }
      ]
    },
    {
      id: 'update-cheetsheet-section',
      name: 'Update CheetSheet Section',
      method: 'PUT',
      url: '/cheat-sheets/main-section/section/update/{id}',
      description: 'Update an existing cheat sheet section by its ID. For image content, upload the image using Postman form data.',
      parameters: [
        {
          name: 'id',
          type: 'number',
          required: true,
          inPath: true,
          description: 'The ID of the cheat sheet section to update',
          example: '6'
        },
        {
          name: 'title',
          type: 'string',
          required: true,
          description: 'Updated title of the section',
          example: 'demo6'
        },
        {
          name: 'contentType',
          type: 'string',
          required: true,
          description: 'Updated type of content (text or image)',
          example: 'text'
        },
        {
          name: 'content',
          type: 'string',
          required: true,
          description: 'Updated content of the section',
          example: 'demo123'
        },
        {
          name: 'mainSectionId',
          type: 'number',
          required: true,
          description: 'Updated main section ID',
          example: 4
        },
        {
          name: 'sectionImage',
          type: 'file',
          required: false,
          description: 'Updated image file (if contentType is image)',
          example: 'new-image.png'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Cheat sheet section updated successfully',
          example: {
            "id": 6,
            "title": "demo6",
            "contentType": "text",
            "content": "demo123",
            "sectionImage": null,
            "mainSectionId": 4,
            "created_at": "2025-05-12T14:53:48.000Z",
            "updated_at": "2025-05-12T14:53:48.000Z"
          }
        },
        {
          status: 404,
          description: 'Cheat sheet section not found',
          example: {
            "success": false,
            "message": "Cheat sheet section not found"
          }
        }
      ]
    },
    {
      id: 'delete-cheetsheet-section',
      name: 'Delete CheetSheet Section',
      method: 'DELETE',
      url: '/cheat-sheets/main-section/section/delete/{id}',
      description: 'Delete a cheat sheet section by its ID.',
      parameters: [
        {
          name: 'id',
          type: 'number',
          required: true,
          inPath: true,
          description: 'The ID of the cheat sheet section to delete',
          example: '6'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Cheat sheet section deleted successfully',
          example: {
            "message": "Section deleted successfully"
          }
        },
        {
          status: 404,
          description: 'Cheat sheet section not found',
          example: {
            "success": false,
            "message": "Cheat sheet section not found"
          }
        }
      ]
    }
  ]
};

export default cheetsheetSectionData;