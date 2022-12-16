import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { JsonRpcProvider } from 'near-api-js/lib/providers';
import { AccessKeyList } from 'near-api-js/lib/providers/provider';
import { PublicKey } from 'near-api-js/lib/utils/key_pair';

interface AuthSignature {
  accountId: string;
  publicKey: string;
  signedTimestamp: string;
  timestamp: string;
}

interface Profile {
  age?: number;
  astrological_sign?: number;
  birthday?: string;
  education?: string;
  favoriteJohnCarpenterMovie?: string;
  gender?: string;
  income?: number;
  preferred_wallet?: string;
  preferred_crypto?: string;
  preferred_nft_marketplace?: string;
  profession?: string;
}

interface CreateQueryRequest {
  authSignature: AuthSignature;
  contractId: string;
}

interface ViewResultsRequest {
  authSignature: AuthSignature;
  contractId: string;
  queryId: string;
}

interface RegisterConsumerRequest {
  authSignature: AuthSignature;
  name: string;
  contractId: string;
  initialBalance: string;
}

interface RegisterProducerRequest {
  accountId: string;
  authSignature: AuthSignature;
  profile: Profile;
}

interface ProducerEvent {
  data: any;
  type: string;
}

interface ProducerEventRequest {
  accountId: string;
  authSignature: AuthSignature;
  events: Array<ProducerEvent>;
}

async function authenticate(authSignature: AuthSignature) {
  if (
    !PublicKey.fromString(authSignature.publicKey).verify(
      Buffer.from(authSignature.timestamp),
      Buffer.from(authSignature.signedTimestamp),
    )
  ) {
    return false;
  }

  const provider = new JsonRpcProvider({ url: 'https://rpc.mainnet.near.org' });
  const accessKeys = await provider.query<AccessKeyList>({
    request_type: 'view_access_key_list',
    account_id: authSignature.accountId,
    finality: 'optimistic',
  });

  return accessKeys.keys.some(
    ({ public_key }) => public_key === authSignature.publicKey,
  );
}

const accounts: { [key: string]: any } = {};
const metrics: { [key: string]: Array<ProducerEvent> } = {};
const queries: { [key: string]: any } = {};

@Controller()
export class AppController {
  @Get('consumer/:organizationId')
  getConsumer(@Param('organizationId') organizationId: string) {
    return {
      organizationId,
    };
  }

  @Post('consumer')
  registerConsumer(@Body() consumer: RegisterConsumerRequest) {
    return {
      organizationId: `${consumer.name}-123`,
      transactionId: '4yRSZ11rrEVGYwoE99LFN9VKPtU3Mz9owr8JxwtJ9mjN',
      balance: 100,
    };
  }

  @Post('consumer/:contractId/query')
  createQuery(@Body() query: CreateQueryRequest) {
    const queryId = Math.floor(Math.random() * 10000);
    queries[queryId] = { ...query, accessed: false };
    return {
      estimatedCost: Math.random() * 10000,
      queryId,
    };
  }

  @Post('consumer/:contractId/results/:queryId')
  viewResults(@Body() viewResults: ViewResultsRequest) {
    const queryId = viewResults.queryId || Object.keys(queries)[0];
    const query = queries[queryId];
    if (!query.accessed) {
      // payout
      queries[queryId] = { ...query, accessed: true };
    }

    return {
      cost: Math.random() * 10000,
      results: Object.values(accounts)
        .map(({ profile }) => Object.entries(profile))
        .flat()
        .reduce((values: { [key: string]: number }, [key, value]) => {
          const pair = [key, value].join(':');
          if (!values[pair]) {
            values[pair] = 0;
          }
          values[pair]++;
          return values;
        }, {}),
    };
  }

  @Post('producer')
  registerProducer(@Body() producer: RegisterProducerRequest) {
    accounts[producer.accountId] = { profile: producer.profile };
    return {
      accountId: producer.accountId,
    };
  }

  @Get('producer/:accountId/events')
  listEvents(@Param('accountId') accountId: string) {
    return metrics[accountId];
  }

  @Get('producer/:accountId/profile')
  listProfiles(@Param('accountId') accountId: string) {
    return accounts[accountId];
  }

  @Post('producer/:accountId/event')
  reportEvent(@Body() eventRequest: ProducerEventRequest) {
    metrics[eventRequest.accountId] = (
      metrics[eventRequest.accountId] || []
    ).concat(eventRequest.events);
    return {
      eventsRecorded: metrics[eventRequest.accountId].length,
    };
  }
}
