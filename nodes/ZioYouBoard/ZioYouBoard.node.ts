import { INodeType, INodeTypeDescription, NodeConnectionType } from 'n8n-workflow';

export class ZioYouBoard implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
        displayName: 'ZioYou Board',
        name: 'zioYouBoard',
        icon: 'file:ic_launcher.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
        description: '지오유 그룹웨어에서 게시방에 글을 접근하는 API입니다.',
        defaults: {
            name: 'ZioYou Board',
        },
        inputs: ['main'] as [NodeConnectionType],
        outputs: ['main'] as [NodeConnectionType],
        credentials: [
            {
                name: 'zioYouBoardApi',
                required: true,
            },
        ],
        requestDefaults: {
            baseURL: 'https://api.zio.run',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        },        
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: '게시글 작업',
                        value: 'zioyouBoardDoc',
                    },
                    {
                        name: '하나의 게시글 안에 있는 이벤트',
                        value: 'zioyouBoardEventDoc',
                    },
                ],
                default: 'zioyouBoardDoc',
            },
            // Operations will go here
		    // Resources and operations will go here       
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: [
                            'zioyouBoardDoc',
                        ],
                    },
                },
                options: [
                    {
                        name: '새로운 게시글 생성',
                        value: 'get',
                        action: '새로운 게시글 생성',
                        description: '새로운 게시글을 생성합니다',
                        routing: {
                            request: {
                                method: 'GET',
                                url: '/zioyou/board/doc_create',
                            },
                        },
                    },
                ],
                default: 'get',
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                displayOptions: {
                    show: {
                        resource: [
                            'zioyouBoardEventDoc',
                        ],
                    },
                },
                options: [
                    {
                        name: '확인라인 상태가 업데이트 되었을 때',
                        value: 'get',
                        action: '확인라인 상태가 업데이트 되었을 때',
                        description: '게시글 안에 확인라인을 누군가 클릭해서 상태가 업데이트 되었을 때 이벤트를 수신합니다',
                        routing: {
                            request: {
                                method: 'GET',
                            },
                        },
                    },
                    {
                        name: '댓글이 신규로 작성되었을 때',
                        value: 'get',
                        action: '댓글이 신규로 작성되었을 때',
                        description: '게시글 열람권한이 있는 사람이, 신규로 댓글이 작성되었을 때',
                        routing: {
                            request: {
                                method: 'GET',
                            },
                        },
                    },
                ],
                default: 'get',
            },
            {
                displayName: '게시방 선택',
                description: '게시글 생성을 위한 게시방을 선택하세요',
                required: true,
                name: 'roomName',
                type: 'options',
                options: [
                    {name: '전사공지', value: 'room101'},
                    {name: '제주도 출장 관련자료', value: 'room102'},
                    {name: '인사공지', value: 'room103'},
                    {name: '문서관리대장', value: 'room104'},
                ],
                routing: {
                    request: {
                        url: '=/zioyou-board/api/v1/room/{{$value}}/doc',
                    },
                },
                default: 'room101',
                displayOptions: {
                    show: {
                        resource: [
                            'zioyouBoardDoc',
                        ],
                    },
                },
            },
            {
                displayName: '게시글ID',
                description: '게시글을 식별하는 ID를 입력하세요. API에서 생성한 ID를 사용하세요.',
                required: true,
                name: 'doc',
                type: 'string',
                default:'',
                displayOptions: {
                    show: {
                        resource: [
                            'zioyouBoardEventDoc',
                        ],
                    },
                },
                routing: {
                    request: {
                        // You've already set up the URL. qs appends the value of the field as a query string
                        qs: {
                            doc_id: '={{ new Date($value).toISOString().substr(0,10) }}',
                        },
                    },
                },
            },
            {
                displayName: '처리일자',
                description: '게시글을 처리하는 일자를 지정할 수 있습니다',
                required: true,
                name: 'transDate',
                type: 'dateTime',
                default:'',
                displayOptions: {
                    show: {
                        resource: [
                            'zioyouBoardEventDoc',
                        ],
                    },
                },
                routing: {
                    request: {
                        // You've already set up the URL. qs appends the value of the field as a query string
                        qs: {
                            trans_date: '={{ new Date($value).toISOString().substr(0,10) }}',
                        },
                    },
                },
            },            
            // Optional/additional fields will go here    
            {
                displayName: 'Additional Fields',
                name: 'additionalFields',
                type: 'collection',
                default: {},
                placeholder: 'Add Field',
                displayOptions: {
                    show: {
                        resource: [
                            'zioyouBoardDoc',
                        ],
                        operation: [
                            'get',
                        ],
                    },
                },
                options: [
                    {
                        displayName: 'Date',
                        name: 'apodDate',
                        type: 'dateTime',
                        default: '',
                        routing: {
                            request: {
                                // You've already set up the URL. qs appends the value of the field as a query string
                                qs: {
                                    date: '={{ new Date($value).toISOString().substr(0,10) }}',
                                },
                            },
                        },
                    },
                ],									
            }                    
        ]        
	};
}