/**
 * @swagger
 * definitions:
 *  Story:
 *    type: "object"
 *    properties:
 *      contentSnippet: 
 *        type: "string"
 *      date:
 *        type: "string"
 *        format: "date-time"
 *      hours:
 *        type: "string"
 *      imageUrl:
 *        type: "string"
 *      keep:
 *        type: boolean
 *      link:
 *        type: string
 *      source:
 *        type: string
 *      storyID:
 *        type: string
 *      title:
 *        type: string
 */ 

 /**
 * @swagger
 * definitions:
 *  Register:
 *    type: "object"
 *    properties:
 *      email: 
 *        type: "string"
 *      password:
 *        type: "string"
 *      displayName:
 *        type: "string"
 */ 

/**
 * @swagger
 * definitions:
 *  Settings:
 *    type: "object"
 *    properties:
 *      requireWIFI: 
 *        type: boolean
 *        default: true
 *      enableAlerts:
 *        type: boolean
 *        default: false
 */ 

/**
 * @swagger
 * definitions:
 *  Filter:
 *    type: "object"
 *    properties:
 *      name: 
 *        type: string
 *      keyWords:
 *        type: array
 *        items:
 *          type: string
 *      enableAlert:
 *        type: boolean
 *        default: false
 *      alertFrequency:
 *        type: "integer"
 *        format: "int32"
 *      enableAutoDelete:
 *        type: boolean
 *        default: false
 *      deleteTime:
 *        type: integer
 *        format: int32
 *      timeOfLastScan:
 *        type: integer
 *        format: int32
 *      newsStories:
 *        type: array
 *        items:
 *          type: string 
 */ 

/**
 * @swagger
 * definitions:
 *  User:
 *    type: "object"
 *    properties:
 *      "type":
 *         type: string
 *      displayName:
 *         type: string
 *      email:
 *         type: string
 *      settings:
 *         $ref: '#/definitions/Settings'
 *      savedStories:
 *        type: array
 *        items:
 *          type: string
 *      filters:
 *          type: array
 *          items:
 *            $ref: "#/definitions/Filter"
 */ 
